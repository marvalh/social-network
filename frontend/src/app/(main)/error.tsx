'use client';

import { ServerError } from '@/src/components/layout/ServerError';

export default function MainError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ServerError {...props} />;
}