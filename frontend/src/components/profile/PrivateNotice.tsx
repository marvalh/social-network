import { Lock } from 'lucide-react';

export function PrivateNotice({ firstName }: { firstName: string }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-16 text-center ring-1 ring-white/10">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
        <Lock className="h-5 w-5" />
      </span>
      <h2 className="text-lg font-semibold">This profile is private</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Follow {firstName} to see their posts, followers and the people they follow. They&apos;ll
        get a request to approve.
      </p>
    </section>
  );
}
