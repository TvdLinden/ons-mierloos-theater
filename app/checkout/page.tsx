import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import CheckoutForm from './CheckoutForm';
import { Session } from 'next-auth';

export default async function CheckoutPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  return <CheckoutForm userName={session?.user?.name} userEmail={session?.user?.email} />;
}
