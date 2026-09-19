'use client';

import type { ReactNode } from 'react';
import { AuthShell } from '@/src/components/layout/AuthShell';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { useRequireGuest } from '@/src/hooks/useRequireGuest';

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  const { checking } = useRequireGuest();

  if (checking) {
    return <FullPageSpinner />;
  }

  return <AuthShell>{children}</AuthShell>;
}