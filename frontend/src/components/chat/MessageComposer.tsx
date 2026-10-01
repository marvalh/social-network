'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/src/services/api';

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  onTyping?: () => void;
}

export function MessageComposer({ onSend, onTyping }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(trimmed);
      setContent('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send that message.');
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3">
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
        />
        <Button type="submit" size="icon" disabled={sending || !content.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  );
}
