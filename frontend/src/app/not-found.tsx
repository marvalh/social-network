import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ErrorState } from '@/src/components/layout/ErrorState';

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="This page escaped"
      message="The page you're looking for doesn't exist or was moved."
      icon={
        <div className="glow relative h-44 w-44 overflow-hidden rounded-2xl">
          <Image src="/escape.png" alt="" fill sizes="176px" className="object-cover" />
        </div>
      }
    >
      <Link href="/" className={buttonVariants({ size: 'lg' })}>
        Go home
      </Link>
    </ErrorState>
  );
}