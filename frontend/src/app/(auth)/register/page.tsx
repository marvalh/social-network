import type { Metadata } from 'next';
import { RegisterForm } from '@/src/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an account · Social Network',
};

export default function RegisterPage() {
  return <RegisterForm />;
}