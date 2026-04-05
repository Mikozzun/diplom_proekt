import { createAuthClient } from 'better-auth/react';
import { usernameClient, phoneNumberClient } from 'better-auth/client/plugins';

const baseURL = import.meta.env.DEV
  ? 'http://localhost:4000'
  : window.location.origin;

export const authClient = createAuthClient({
  baseURL,
  plugins: [usernameClient(), phoneNumberClient()],
});

export const { signUp, signIn, signOut, useSession } = authClient;
