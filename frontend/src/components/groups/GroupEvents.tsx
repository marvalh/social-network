'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, groupsApi } from '@/src/services/api';
import type { GroupEvent } from '@/src/types/group';
import { BackLink } from '@/src/components/layout/BackLink';
import { StatusError, statusOf, type ErrorStatus } from '@/src/components/layout/StatusError';

interface GroupEventsProps {
  groupId: string;
}

export function GroupEvents({ groupId }: GroupEventsProps) {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadFailure, setLoadFailure] = useState<ErrorStatus | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [groupId]);

  function load() {
    setLoading(true);
    setLoadFailure(null);
    groupsApi
      .events(groupId)
      .then((data) => setEvents(data.events))
      .catch((err) => setLoadFailure(statusOf(err)))
      .finally(() => setLoading(false));
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await groupsApi.createEvent(groupId, {
        title: title.trim(),
        description: description.trim(),
        eventTime: new Date(eventTime).toISOString(),
      });
      setTitle('');
      setDescription('');
      setEventTime('');
      load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Could not create the event.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRSVP(eventId: string, response: 'going' | 'not_going') {
    setBusyId(eventId);
    try {
      await groupsApi.respondToEvent(eventId, { response });
      setEvents((current) =>
        current.map((ev) => {
          if (ev.eventId !== eventId) return ev;
          const wasGoing = ev.myResponse === 'going';
          const wasNotGoing = ev.myResponse === 'not_going';
          return {
            ...ev,
            myResponse: response,
            goingCount: ev.goingCount + (response === 'going' ? 1 : 0) - (wasGoing ? 1 : 0),
            notGoingCount:
              ev.notGoingCount + (response === 'not_going' ? 1 : 0) - (wasNotGoing ? 1 : 0),
          };
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  }

  if (loadFailure) return <StatusError status={loadFailure} onRetry={load} />;

  return (
    <div className="space-y-5">
      <BackLink href={`/groups/${groupId}`} label="Group" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">Upcoming events for this group.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Event'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
          <h2 className="text-sm font-semibold">New event</h2>
          <form onSubmit={handleCreate} className="mt-3 space-y-3">
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="eventTitle">Title</Label>
              <Input
                id="eventTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventDescription">Description</Label>
              <textarea
                id="eventDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventTime">Date & time</Label>
              <Input
                id="eventTime"
                type="datetime-local"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={creating || !title.trim() || !eventTime}>
              {creating ? 'Creating…' : 'Create Event'}
            </Button>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
        <h2 className="text-sm font-semibold">Upcoming</h2>
        {loading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {!loading && events.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No events yet.</p>
        )}
        <ul className="mt-3 space-y-2">
          {events.map((ev) => (
            <li
              key={ev.eventId}
              className="rounded-lg border border-surface-border bg-surface px-3 py-2"
            >
              <p className="text-sm font-medium">{ev.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(ev.eventTime).toLocaleString()}
              </p>
              {ev.description && (
                <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant={ev.myResponse === 'going' ? 'default' : 'secondary'}
                  disabled={busyId === ev.eventId}
                  onClick={() => handleRSVP(ev.eventId, 'going')}
                >
                  Going ({ev.goingCount})
                </Button>
                <Button
                  size="sm"
                  variant={ev.myResponse === 'not_going' ? 'default' : 'secondary'}
                  disabled={busyId === ev.eventId}
                  onClick={() => handleRSVP(ev.eventId, 'not_going')}
                >
                  Not going ({ev.notGoingCount})
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}