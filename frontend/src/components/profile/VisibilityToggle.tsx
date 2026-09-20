'use client';

import { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { ApiError, profileApi } from '@/src/services/api';

interface VisibilityToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}

export function VisibilityToggle({ isPublic, onChange }: VisibilityToggleProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      onChange(await profileApi.setVisibility(!isPublic));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update visibility.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/5">
      <div className="flex-1">
        <p className="text-sm font-medium">
          {isPublic ? 'Anyone can see your profile' : 'Only followers can see your profile'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPublic
            ? 'Your posts, followers and following are visible to every logged-in user.'
            : 'People need an approved follow request before they can see your activity.'}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        aria-label="Public profile"
        disabled={busy}
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
          isPublic ? 'gradient' : 'bg-white/10'
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-black transition-transform ${
            isPublic ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        >
          {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        </span>
      </button>

      {error && (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
