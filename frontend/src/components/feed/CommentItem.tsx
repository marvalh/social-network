'use client';

import { Heart, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/Auth';
import { ApiError, postsApi } from '@/src/services/api';
import type { Comment } from '@/src/types/post';
import { relativeTime } from '@/src/utils/formatDate';
import { mediaUrl } from '@/src/utils/media';

interface CommentItemProps {
  comment: Comment;
  onUpdated: (comment: Comment) => void;
  onDeleted: (commentId: string) => void;
}

export function CommentItem({ comment, onUpdated, onDeleted }: CommentItemProps) {
  const { user } = useAuth();
  const isOwner = user?.userId === comment.userId;

  const [busy, setBusy] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickAway(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [menuOpen]);

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    const nextLiked = !comment.likedByViewer;
    const optimistic = {
      ...comment,
      likedByViewer: nextLiked,
      likeCount: comment.likeCount + (nextLiked ? 1 : -1)
    };
    onUpdated(optimistic);
    try {
      await (nextLiked
        ? postsApi.likeComment(comment.commentId)
        : postsApi.unlikeComment(comment.commentId));
    } catch {
      onUpdated(comment)
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await postsApi.updateComment(comment.commentId, { content: draft.trim() });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your comment.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await postsApi.removeComment(comment.commentId);
      onDeleted(comment.commentId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this comment.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  const avatarUrl = mediaUrl(comment.authorAvatar);
  const imageUrl = mediaUrl(comment.img);

  return (
    <div className="flex gap-3 border-t border-border pt-4">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-brand-400">
          {comment.authorName.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/profile/${comment.userId}`}
              className="text-sm font-semibold hover:text-link"
            >
              {comment.authorName}
            </Link>
            <span className="ml-2 text-xs text-muted-foreground">
              {relativeTime(comment.createdAt)}
            </span>
          </div>
          {isOwner && (
            <div className="relative shrink-0" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="More comment actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <Pencil className="size-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={2}
              autoFocus
              className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            <div className="mt-1.5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.content);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="xs"
                onClick={saveEdit}
                disabled={saving || !draft.trim()}
                className="gradient border-0 text-white"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 break-words text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
            {comment.content}
          </p>
        )}

        {imageUrl && !editing && (
          <img
            src={imageUrl}
            alt=""
            className="mt-2 max-h-56 rounded-lg border border-border object-cover"
          />
        )}

        {confirmingDelete && (
          <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs">
            <p className="text-destructive">Delete this comment?</p>
            {error && <p className="mt-1 text-destructive">{error}</p>}
            <div className="mt-1.5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="size-3 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        )}

        {!editing && (
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={comment.likedByViewer}
            className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${comment.likedByViewer ? 'text-rose-400' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`size-3.5 ${comment.likedByViewer ? 'fill-current' : ''}`} />{' '}
            {comment.likeCount > 0 ? comment.likeCount : 'Like'}
          </button>
        )}
      </div>
    </div>
  );
}
