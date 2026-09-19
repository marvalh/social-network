import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/src/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Log in · Social Network',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}