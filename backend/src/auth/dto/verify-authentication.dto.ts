import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

export class VerifyAuthenticationDto {
  credential: AuthenticationResponseJSON;
}
