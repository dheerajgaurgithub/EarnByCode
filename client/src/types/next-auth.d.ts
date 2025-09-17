import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      token: string;  // Add the token property
      // Add any other custom properties you have in your session
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    token: string;  // Add the token property
    // Add any other custom properties you have in your JWT
  }
}
