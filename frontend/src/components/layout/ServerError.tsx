'use client';

import { useEffect } from 'react';
import { StatusError } from '@/src/components/layout/StatusError';

interface ServerErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ServerError({ error, reset }: ServerErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <StatusError status={500} onRetry={reset} />;
}