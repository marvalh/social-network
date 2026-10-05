'use client';

import { useCallback, useEffect, useState } from 'react';
import { profileApi } from '@/src/services/api';
import { useLive } from '@/src/hooks/useLive';
import { statusOf, type ErrorStatus } from '@/src/components/layout/StatusError';
import type { Profile } from '@/src/types/user';

interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  failure: ErrorStatus | null;

  refresh: () => Promise<void>;

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

  // Follows, accepts and profile edits anywhere can change what this page shows.
  useLive('follow', refresh);
  useLive('profile', refresh);

  return { profile, loading, failure, refresh, patch };
}