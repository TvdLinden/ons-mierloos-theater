import type { DefaultSession } from 'next-auth';

// Inline the user role union to avoid importing runtime app code in a global declaration
type UserRole = 'user' | 'admin' | 'contributor';

declare module 'next-auth' {
  // Extend the default Session so we keep NextAuth's built-in fields
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
