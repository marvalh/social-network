import type { ReactNode } from 'react';

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) {
    return null;
  }
  return (
    <p role="alert" className="text-sm text-destructive">
      {children}
    </p>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
    >
      {children}
    </p>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`text-xs ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
      {value.length}/{max}
    </span>
  );
}
