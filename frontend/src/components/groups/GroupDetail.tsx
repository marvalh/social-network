'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, MessageCircle } from 'lucide-react';
import { useAuth } from '@/src/context/Auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, groupsApi } from '@/src/services/api';
import type { GroupDetail as GroupDetailType, GroupMember, GroupJoinRequest } from '@/src/types/group';
import { BackLink } from '@/src/components/layout/BackLink';
import { StatusError, statusOf, type ErrorStatus } from '@/src/components/layout/StatusError';
import { UserChip } from './UserChip';

interface GroupDetailProps {
  groupId: string;
}

export function GroupDetail({ groupId }: GroupDetailProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadFailure, setLoadFailure] = useState<ErrorStatus | null>(null);

  const [inviteId, setInviteId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [actionBusy, setActionBusy] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setLoadFailure(null);
      try {
        const groupDetail = await groupsApi.get(groupId);
        setGroup(groupDetail);

        if (groupDetail.isMember) {
          const { members } = await groupsApi.members(groupId);
          setMembers(members);

          if (user && groupDetail.creatorId === user.userId) {
            const { requests } = await groupsApi.joinRequests(groupId);
            setJoinRequests(requests);
          }
        }
      } catch (err) {
        setLoadFailure(statusOf(err)); 
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, user]);

  async function handleRequestToJoin() {
    setActionBusy(true);
    try {
      await groupsApi.requestToJoin(groupId);
      setRequested(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleLeave() {
    setActionBusy(true);
    try {
      await groupsApi.leave(groupId);
      router.push('/groups');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
      setActionBusy(false);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setInviting(true);
    setInviteError(null);
    try {
      await groupsApi.sendInvite(groupId, { invitedTo: inviteId.trim() });
      setInviteId('');
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : 'Could not send the invite.');
    } finally {
      setInviting(false);
    }
  }

  async function handleJoinRequestResponse(requestedBy: string, accept: boolean) {
    setActionBusy(true);
    try {
      await groupsApi.respondToJoinRequest(groupId, requestedBy, { accept });
      setJoinRequests((current) => current.filter((r) => r.requestedBy !== requestedBy));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (loadFailure && !group) return <StatusError status={loadFailure} />;
  if (!group) return null;

  const isCreator = user?.userId === group.creatorId;

  return (
    <div className="space-y-5">
      <BackLink href="/groups" label="Groups" />

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>

          {group.isMember ? (
            <Button size="sm" variant="ghost" disabled={actionBusy} onClick={handleLeave}>
              Leave
            </Button>
          ) : (
            <Button size="sm" disabled={actionBusy || requested} onClick={handleRequestToJoin}>
              {requested ? 'Requested' : 'Request to Join'}
            </Button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {group.isMember && (
        <>
          <Link
            href={`/groups/${groupId}/events`}
            className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm font-medium ring-1 ring-white/10 hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-brand-400" />
              Events
            </span>
            <span className="text-muted-foreground">View all →</span>
          </Link>

          <Link
            href={`/groups/${groupId}/chat`}
            className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm font-medium ring-1 ring-white/10 hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="size-4 text-brand-400" />
              Group chat
            </span>
            <span className="text-muted-foreground">Open →</span>
          </Link>

          <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
            <h3 className="text-sm font-semibold">Invite someone</h3>
            <form onSubmit={handleInvite} className="mt-2 flex gap-2">
              <Input
                value={inviteId}
                onChange={(e) => setInviteId(e.target.value)}
                placeholder="User ID (the last part of their profile link)"
                required
              />
              <Button type="submit" size="sm" disabled={inviting || !inviteId.trim()}>
                Invite
              </Button>
            </form>
            {inviteError && <p className="mt-2 text-sm text-destructive">{inviteError}</p>}
          </div>

          {isCreator && joinRequests.length > 0 && (
            <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
              <h3 className="text-sm font-semibold">Join requests</h3>
              <ul className="mt-2 space-y-2">
                {joinRequests.map((req) => (
                  <li
                    key={req.requestedBy}
                    className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2"
                  >
                    <UserChip userId={req.requestedBy} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actionBusy}
                        onClick={() => handleJoinRequestResponse(req.requestedBy, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionBusy}
                        onClick={() => handleJoinRequestResponse(req.requestedBy, false)}
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
            <h3 className="text-sm font-semibold">Members ({members.length})</h3>
            <ul className="mt-3 space-y-3">
              {members.map((m) => (
                <li key={m.userId}>
                  <UserChip userId={m.userId} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}