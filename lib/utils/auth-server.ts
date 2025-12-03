import NextAuth from 'next-auth';
import { authOptions } from './auth';

export const { signIn, signOut, auth } = NextAuth(authOptions);
