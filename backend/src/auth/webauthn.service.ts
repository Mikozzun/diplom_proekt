import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifiedRegistrationResponse,
  GenerateAuthenticationOptionsOpts,
  VerifiedAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name);

  /**
   * RP (Relying Party) configuration.
   * Override these with env vars in production.
   */
  private readonly rpName = process.env.RP_NAME || 'Frogger';
  private readonly rpID = process.env.RP_ID || 'localhost';
  private readonly origin = process.env.ORIGIN || 'http://localhost:3000';

  /**
   * In-memory challenge store (keyed by phone number or credentialId).
   * For multi‑instance deployments move this into Redis.
   */
  private readonly challengeStore = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────
  //  REGISTRATION  (Setup Phase)
  // ────────────────────────────────────────

  /**
   * Step 1 – Generate registration options for the browser to call
   * `navigator.credentials.create()`.
   */
  async generateRegistrationOptions(phoneNumber: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { phoneNumber },
      include: { credentials: true },
    });

    const excludeCredentials =
      existingUser?.credentials.map((c) => ({
        id: c.credentialId,
        type: 'public-key' as const,
        transports: c.transports as AuthenticatorTransportFuture[],
      })) ?? [];

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: this.rpName,
      rpID: this.rpID,
      userName: phoneNumber,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    };

    const options = await generateRegistrationOptions(opts);

    // Persist the challenge so we can verify in the next step
    this.challengeStore.set(`reg:${phoneNumber}`, options.challenge);

    return options;
  }

  /**
   * Step 2 – Verify the attestation response sent back by the browser
   * and persist the new credential.
   */
  async verifyRegistration(
    phoneNumber: string,
    credential: RegistrationResponseJSON,
  ) {
    const expectedChallenge = this.challengeStore.get(`reg:${phoneNumber}`);
    if (!expectedChallenge) {
      throw new BadRequestException(
        'Registration challenge not found or expired. Please restart.',
      );
    }

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Registration verification failed', message);
      throw new BadRequestException(`Verification failed: ${message}`);
    } finally {
      this.challengeStore.delete(`reg:${phoneNumber}`);
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Registration verification failed');
    }

    const { credential: regCredential } = verification.registrationInfo;

    // Upsert user (first passkey registration creates the user)
    let user = await this.prisma.user.findFirst({
      where: { phoneNumber },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          username: phoneNumber,
          passkey: '', // legacy column – not used for WebAuthn
        },
      });
    }

    // Save credential
    await this.prisma.credential.create({
      data: {
        userId: user.id,
        credentialId: regCredential.id,
        credentialPublicKey: Buffer.from(regCredential.publicKey),
        counter: BigInt(regCredential.counter),
        transports: credential.response.transports ?? [],
      },
    });

    this.logger.log(`Passkey registered for user ${user.id} (${phoneNumber})`);

    return { verified: true, userId: user.id.toString() };
  }

  // ────────────────────────────────────────
  //  AUTHENTICATION  (Assertion Phase)
  // ────────────────────────────────────────

  /**
   * Step 1 – Generate authentication options.
   * Using discoverable credentials (allowCredentials: []) so
   * the browser/platform shows all available passkeys.
   */
  async generateAuthenticationOptions() {
    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: this.rpID,
      userVerification: 'preferred',
      // Empty array → discoverable credentials (cross-device support)
      allowCredentials: [],
    };

    const options = await generateAuthenticationOptions(opts);

    // Save challenge keyed by the challenge itself (we'll look it up on verify)
    this.challengeStore.set(`auth:${options.challenge}`, options.challenge);

    return options;
  }

  /**
   * Step 2 – Verify the assertion response.
   * Returns the authenticated user on success.
   */
  async verifyAuthentication(credential: AuthenticationResponseJSON) {
    // Look up stored credential by the ID the browser sent back
    const storedCredential = await this.prisma.credential.findUnique({
      where: { credentialId: credential.id },
      include: { user: true },
    });

    if (!storedCredential) {
      throw new BadRequestException('Credential not recognised');
    }

    // Find and validate the challenge
    const expectedChallenge = this.challengeStore.get(
      `auth:${
        credential.response.clientDataJSON
          ? this.extractChallenge(credential)
          : ''
      }`,
    );

    // Fallback: iterate challenge store to find matching challenge
    let challenge: string | undefined = expectedChallenge;
    if (!challenge) {
      for (const [key, value] of this.challengeStore.entries()) {
        if (key.startsWith('auth:')) {
          challenge = value;
          this.challengeStore.delete(key);
          break;
        }
      }
    }

    if (!challenge) {
      throw new BadRequestException(
        'Authentication challenge not found or expired',
      );
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: storedCredential.credentialId,
          publicKey: new Uint8Array(storedCredential.credentialPublicKey),
          counter: Number(storedCredential.counter),
          transports:
            storedCredential.transports as AuthenticatorTransportFuture[],
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Authentication verification failed', message);
      throw new BadRequestException(`Verification failed: ${message}`);
    }

    if (!verification.verified) {
      throw new BadRequestException('Authentication verification failed');
    }

    // Update the counter to prevent replay attacks
    await this.prisma.credential.update({
      where: { id: storedCredential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
      },
    });

    this.logger.log(`User ${storedCredential.user.id} authenticated`);

    return {
      verified: true,
      user: storedCredential.user,
    };
  }

  /** Extract challenge from clientDataJSON for store lookup */
  private extractChallenge(credential: AuthenticationResponseJSON): string {
    try {
      const clientDataJSON = Buffer.from(
        credential.response.clientDataJSON,
        'base64url',
      ).toString('utf-8');
      return (JSON.parse(clientDataJSON) as { challenge: string }).challenge;
    } catch {
      return '';
    }
  }
}
