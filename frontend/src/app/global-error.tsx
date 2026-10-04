'use client';

import '@/src/css/globals.css';
import { ServerError } from '@/src/components/layout/ServerError';

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ServerError {...props} />
      </body>
    </html>
  );
}