import { createAuthClient } from 'better-auth/react';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const authClient = createAuthClient({ baseURL });

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
