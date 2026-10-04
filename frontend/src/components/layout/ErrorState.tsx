import type { ReactNode } from 'react';

interface ErrorStateProps {
  code: string;
  title: string;
  message: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function ErrorState({ code, title, message, icon, children }: ErrorStateProps) {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-6">{icon}</div>} 
      <p className="gradient-text text-7xl font-extrabold tracking-tight sm:text-8xl">{code}</p>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {children && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
      )}
    </div>
  );
}

