'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/src/services/api';
import { EmojiPicker } from './EmojiPicker';

const MAX_LENGTH = 150;

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  onTyping?: () => void;
}

export function MessageComposer({ onSend, onTyping }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const remaining = MAX_LENGTH - content.length;

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  async function submit() {
    const trimmed = content.trim().slice(0, MAX_LENGTH);
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(trimmed);
      setContent('');
      setPickerOpen(false);
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

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    setContent((content.slice(0, start) + emoji + content.slice(end)).slice(0, MAX_LENGTH));
    onTyping?.();
    requestAnimationFrame(() => {
      el?.focus();
      const caret = Math.min(start + emoji.length, MAX_LENGTH);
      el?.setSelectionRange(caret, caret);
    });
  }

    return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3">
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <div className="flex items-end gap-2">
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            aria-label="Add emoji"
            aria-expanded={pickerOpen}
            className="grid h-[38px] w-[38px] place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Smile className="size-5" />
          </button>
          {pickerOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-2">
              <EmojiPicker onSelect={insertEmoji} />
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            maxLength={MAX_LENGTH}
            className="block max-h-32 min-h-[38px] w-full resize-none rounded-lg border border-border bg-surface py-2 pr-14 pl-3 text-sm outline-none"
          />
          {content.length > 0 && (
            <span
              className={`pointer-events-none absolute right-3 bottom-2 text-xs ${
                remaining <= 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {content.length}/{MAX_LENGTH}
            </span>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={sending || !content.trim()}
          className="h-[38px] w-[38px]"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  );
}