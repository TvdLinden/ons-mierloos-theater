// Auth utilities
import { getServerSession } from 'next-auth/next';
import { signIn } from 'next-auth/react';
import type { Session } from 'next-auth';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../db';
import { redirect } from 'next/navigation';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/queries/users';

/**
 * Validates user credentials and returns user info if valid
 */
export async function validateCredentials(
  email: string,
  password: string,
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  if (!email || !password) {
    return { success: false, error: 'E-mailadres en wachtwoord zijn verplicht.' };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Ongeldige inloggegevens.' };
  }

  if (!user.passwordHash || typeof user.passwordHash !== 'string') {
    console.log('Missing or invalid password hash for user:', email);
    return { success: false, error: 'Ongeldige inloggegevens.' };
  }

  const valid = await verifyPassword(password, user);
  if (!valid) {
    console.log('Invalid password for user:', email);
    return { success: false, error: 'Ongeldige inloggegevens.' };
  }

  // Check if email is verified
  if (!user.emailVerified) {
    console.log('Email not verified for user:', email);
    return {
      success: false,
      error: 'Email niet geverifieerd. Controleer je inbox voor de verificatie link.',
    };
  }

  // Ensure role is of type UserRole and not null
  if (!user.role) {
    console.log('Missing role for user:', email);
    return { success: false, error: 'Ongeldige gebruikersrol.' };
  }

  return { success: true, user };
}

export const authOptions = {
  debug: false,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await validateCredentials(credentials.email, credentials.password);

        if (!result.success) {
          const err = (result as { success: false; error: string }).error;
          if (err.includes('geverifieerd')) {
            throw new Error(err);
          }
          return null;
        }

        // Update last signin timestamp
        const { updateUser } = await import('@/lib/commands/users');
        await updateUser(result.user.id, { lastSignin: new Date() });

        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role as UserRole,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};

/**
 * Checks if the user is authenticated. If not, redirects to signin (401).
 * Returns the session if authenticated.
 */
export async function requireAuth(): Promise<Session | null> {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session) {
    // 401: Not authenticated, challenge with signIn
    signIn();
  }
  return session;
}

/**
 * Checks if the user has the required role(s). If not, redirects to forbidden (403).
 */
export async function requireRole(roles: UserRole | UserRole[]): Promise<void> {
  const session = (await getServerSession(authOptions)) as Session | null;
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const userRole = session?.user?.role as UserRole | undefined;
  if (!userRole || !allowedRoles.includes(userRole)) {
    // 403: Forbidden, redirect to forbidden page
    redirect('/forbidden');
  }
}

/**
 * Verifies a plain password against a user's password hash.
 */
export async function verifyPassword(plain: string, user: User): Promise<boolean> {
  if (!user.passwordHash) {
    return false;
  }
  return bcrypt.compare(plain, user.passwordHash);
}

/**
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltIterations = 10;
  return bcrypt.hash(password, saltIterations);
}

/**
 * Validates a password reset token and returns the user if valid.
 */
export async function validateResetToken(token: string) {
  const { eq, and, isNotNull, gt } = await import('drizzle-orm');
  const { db } = await import('@/lib/db');
  const { users } = await import('@/lib/db/schema');

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.resetToken, token),
        isNotNull(users.resetToken),
        gt(users.resetTokenExpiry, new Date()),
      ),
    )
    .limit(1);

  return user || null;
}
