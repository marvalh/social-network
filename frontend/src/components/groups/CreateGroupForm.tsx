'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, groupsApi } from '@/src/services/api';

export function CreateGroupForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (!title.trim()) {
      setTitleError('Give your group a name.');
      return;
    }

    setSubmitting(true);
    try {
      const { groupId } = await groupsApi.create({
        title: title.trim(),
        description: description.trim(),
      });
      router.push(`/groups/${groupId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the group.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Group name</Label>
        <Input
          id="title"
          value={title}
          aria-invalid={Boolean(titleError)}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError(null);
          }}
        />
        {titleError && <p className="text-xs text-destructive">{titleError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Group'}
      </Button>
    </form>
  );
}