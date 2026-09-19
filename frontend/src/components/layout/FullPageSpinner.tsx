export function FullPageSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center bg-background"
    >
      <span className="sr-only">Loading</span>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-surface-border border-t-brand-400" />
    </div>
  );
}
