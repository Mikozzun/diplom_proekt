import { VerifiedRegistrationResponse, VerifiedAuthenticationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types';
interface StoredCredential {
    credentialId: string;
    publicKey: string;
    counter: number;
    transports?: string[];
}
export declare const getRegistrationOptions: (userId: string, username: string, existingCredentials?: StoredCredential[]) => Promise<import("@simplewebauthn/types").PublicKeyCredentialCreationOptionsJSON>;
export declare const verifyRegistration: (response: RegistrationResponseJSON, expectedChallenge: string) => Promise<VerifiedRegistrationResponse>;
export declare const getAuthenticationOptions: (credentials?: StoredCredential[]) => Promise<import("@simplewebauthn/types").PublicKeyCredentialRequestOptionsJSON>;
export declare const verifyAuthentication: (response: AuthenticationResponseJSON, expectedChallenge: string, credential: StoredCredential) => Promise<VerifiedAuthenticationResponse>;
export {};
