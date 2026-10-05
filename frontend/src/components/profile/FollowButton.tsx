'use client';

import { useEffect, useState } from 'react';
import { Check, Clock, UserMinus, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/src/components/layout/ConfirmDialog';
import { ApiError, followApi } from '@/src/services/api';
import type { FollowStatus } from '@/src/types/follow';

interface FollowButtonProps {
  userId: string;
  status: FollowStatus;
  requestId?: string;
  /** Used to word the unfollow confirmation. */
  name?: string;
  isPublic?: boolean;
  onChange: (status: FollowStatus) => void;
}

function unfollowNote(isPublic?: boolean) {
  if (isPublic === true) {
    return "You'll stop seeing their posts in your feed. You can follow them again whenever you like.";
  }
  if (isPublic === false) {
    return "You'll stop seeing their posts in your feed. Their profile is private, so you'd need to send a new request and wait for approval to follow them again.";
  }
  return "You'll stop seeing their posts in your feed. If their profile is private, you'll need to send a new request to follow them again.";
}

export function FollowButton({
  userId,
  status,
  requestId: initialRequestId,
  name,
  isPublic,
  onChange,
}: FollowButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(initialRequestId ?? null);

  useEffect(() => {
    setRequestId(initialRequestId ?? null);
  }, [initialRequestId]);

  if (status === 'self') {
    return null;
  }

  async function run(action: () => Promise<FollowStatus>) {
    setBusy(true);
    setError(null);
    try {
      onChange(await action());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  const follow = () =>
    run(() =>
      followApi.follow(userId).then(({ status, requestId }) => {
        setRequestId(requestId);
        return status;
      })
    );

  const cancel = () =>
    run(() =>
      requestId
        ? followApi.cancelRequest(requestId).then(() => 'none' as FollowStatus)
        : Promise.resolve(status)
    );

  async function confirmUnfollow() {
    setBusy(true);
    setError(null);
    try {
      await followApi.unfollow(userId);
      setConfirming(false);
      onChange('none');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  function closeConfirm() {
    setConfirming(false);
    setError(null);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {status === 'none' && (
        <Button
          size="lg"
          disabled={busy}
          onClick={follow}
          className="gradient border-0 px-4 text-white shadow-lg shadow-purple-500/20"
        >
          <UserPlus className="h-4 w-4" />
          {busy ? 'Sending…' : 'Follow'}
        </Button>
      )}

      {status === 'pending' && (
        <Button
          size="lg"
          variant="secondary"
          disabled={busy}
          onClick={cancel}
          className="group px-4"
        >
          <Clock className="h-4 w-4 group-hover:hidden" />
          <X className="hidden h-4 w-4 group-hover:block" />
          <span className="group-hover:hidden">Requested</span>
          <span className="hidden group-hover:inline">Cancel</span>
        </Button>
      )}

      {status === 'accepted' && (
        <Button
          size="lg"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className="group px-4"
        >
          <Check className="h-4 w-4 group-hover:hidden" />
          <UserMinus className="hidden h-4 w-4 group-hover:block" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </Button>
      )}

      {error && !confirming && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        title={name ? `Unfollow ${name}?` : 'Unfollow this person?'}
        icon={<UserMinus className="size-5" />}
        confirmLabel="Unfollow"
        busy={busy}
        error={error}
        onConfirm={confirmUnfollow}
        onCancel={closeConfirm}
      >
        {unfollowNote(isPublic)}
      </ConfirmDialog>
    </div>
  );
}