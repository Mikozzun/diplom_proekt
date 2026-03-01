import type { RegistrationResponseJSON } from '@simplewebauthn/server';

export class VerifyRegistrationDto {
  phoneNumber: string;
  credential: RegistrationResponseJSON;
}
