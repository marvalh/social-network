'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy = false,
  error,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={() => {
          if (!busy) onCancel();
        }}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      />

      <div className="relative z-10 w-full max-w-sm animate-in rounded-2xl bg-card p-6 text-center shadow-2xl ring-1 shadow-black/60 ring-white/10 duration-150 fade-in zoom-in-95">
        {icon && (
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-destructive/15 text-destructive">
            {icon}
          </div>
        )}

        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>

        {children && (
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" disabled={busy} onClick={onCancel} autoFocus>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
