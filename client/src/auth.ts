import { NextAuthOptions, getServerSession as getServerSessionHelper, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    token: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      token: string;
    } & DefaultSession['user'];
  }
}

// TODO: Replace this with your actual auth configuration
// This is a basic setup that you should customize based on your auth needs
export const authOptions: NextAuthOptions = {
  providers: [
    // Configure your authentication providers here
    // Example with credentials provider:
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your own authentication logic here
        // This is just a placeholder
        if (credentials?.email && credentials?.password) {
          // In a real app, you would validate the credentials against your database
          // and return the user object with a valid token
          const user = { 
            id: '1', 
            email: credentials.email, 
            name: 'User',
            token: 'your-auth-token' // This should be set from your actual auth response
          };
          return user;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.token = user.token || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.token = token.token as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// This is the auth function that will be used in API routes
export const auth = () => {
  return getServerSessionHelper(authOptions);
};

// Re-export the getServerSession function
export const getServerSession = getServerSessionHelper;
