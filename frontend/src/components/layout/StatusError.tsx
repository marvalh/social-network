'use client';

import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState } from '@/src/components/layout/ErrorState';
import { ApiError, NetworkError } from '@/src/services/api';

const CONTENT = {
  400: {
    code: '400',
    title: 'Bad request',
    message: "That request didn't look right. Check the link and try again.",
  },
  401: {
    code: '401',
    title: 'Please log in',
    message: 'Your session has expired, or you need to log in to see this.',
  },
  403: {
    code: '403',
    title: 'Access denied',
    message: "You don't have permission to view this. It may be private or members-only.",
  },
  404: {
    code: '404',
    title: 'This page escaped',
    message: "The page you're looking for doesn't exist or was moved.",
  },
  500: {
    code: '500',
    title: 'Something went wrong',
    message: 'We hit an unexpected error on our side. You can try again, or head back home.',
  },
  network: {
    code: '503',
    title: "Can't reach the server",
    message: "We couldn't connect. Check your connection, or try again in a moment.",
  },
} as const;

export type ErrorStatus = keyof typeof CONTENT;

export function statusOf(err: unknown): ErrorStatus {
  if (err instanceof NetworkError) return 'network';
  if (err instanceof ApiError && err.status in CONTENT) return err.status as ErrorStatus;
  return 500;
}

interface StatusErrorProps {
  status: ErrorStatus;
  onRetry?: () => void;
}

export function StatusError({ status, onRetry }: StatusErrorProps) {
  const { code, title, message } = CONTENT[status];
  const canRetry = status === 500 || status === 'network';

  return (
    <ErrorState
      code={code}
      title={title}
      message={message}
      icon={
        status === 404 ? (
          <div className="glow relative h-44 w-44 overflow-hidden rounded-2xl">
            <Image src="/escape.png" alt="" fill sizes="176px" className="object-cover" />
          </div>
        ) : undefined
      }
    >
      {canRetry && (
        <Button size="lg" onClick={onRetry ?? (() => window.location.reload())}>
          Try again
        </Button>
      )}
      {status === 401 ? (
        <a href="/login" className={buttonVariants({ size: 'lg' })}>
          Log in
        </a>
      ) : (
        <a
          href="/"
          className={buttonVariants({ variant: canRetry ? 'secondary' : 'default', size: 'lg' })}
        >
          Go home
        </a>
      )}
    </ErrorState>
  );
}