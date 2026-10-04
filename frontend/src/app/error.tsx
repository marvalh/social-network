'use client';

import { ServerError } from '@/src/components/layout/ServerError';

export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ServerError {...props} />;
}