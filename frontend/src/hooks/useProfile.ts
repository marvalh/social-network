'use client';

import { useCallback, useEffect, useState } from 'react';
import { profileApi } from '@/src/services/api';
import { statusOf, type ErrorStatus } from '@/src/components/layout/StatusError';
import type { Profile } from '@/src/types/user';

interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  failure: ErrorStatus | null;
  /** Re-fetches from the server (after following, editing, etc.). */
  refresh: () => Promise<void>;
  /** Local patch so the UI can update without a round trip. */
  patch: (next: Partial<Profile>) => void;
}

export function useProfile(id: string): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<ErrorStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await profileApi.get(id);
      setProfile(data);
      setFailure(null);
    } catch (err) {
      setFailure(statusOf(err));
      setProfile(null);
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      await load();
      if (active) {
        setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const patch = useCallback((next: Partial<Profile>) => {
    setProfile((current) => (current ? { ...current, ...next } : current));
  }, []);

  return { profile, loading, failure, refresh, patch };
}