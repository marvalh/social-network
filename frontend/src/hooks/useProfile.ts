'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, profileApi } from '@/src/services/api';
import type { Profile } from '@/src/types/user';

interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  /** Re-fetches from the server (after following, editing, etc.). */
  refresh: () => Promise<void>;
  /** Local patch so the UI can update without a round trip. */
  patch: (next: Partial<Profile>) => void;
}

export function useProfile(id: string): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await profileApi.get(id);
      setProfile(data);
      setError(null);
      setNotFound(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        setError(null);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not reach the server. Try again.');
      }
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

  return { profile, loading, error, notFound, refresh, patch };
}
