import type { ReactNode } from 'react';
import Image from 'next/image';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="relative hidden w-1/2 flex-col overflow-hidden border-r border-border bg-canvas lg:flex">
        <div className="ambient-brand pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative z-10 flex items-center gap-2 p-10">
          <div className="gradient flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white">
            SN
          </div>
          <span className="text-xl font-semibold">Social Network</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 pb-16 text-center">
          <p className="gradient-text text-4xl leading-[0.95] font-extrabold tracking-tight">
            Time to
          </p>

          <div className="relative my-5 h-44 w-44 overflow-hidden rounded-xl shadow-2xl shadow-black/90">
            <Image
              src="/escape.png"
              alt="ESC key"
              fill
              sizes="176px"
              className="object-cover"
              priority
            />
          </div>

          <p className="gradient-text text-4xl leading-[0.95] font-extrabold tracking-tight">
            escape
            <br />
            the noise
          </p>

          <p className="mt-8 max-w-xs text-base text-muted-foreground">
            A platform to create, converse and connect.
          </p>
        </div>
      </aside>

      <main className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
