// NextAuth API route for App Router
// See: https://next-auth.js.org/configuration/nextjs#app-router

import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
