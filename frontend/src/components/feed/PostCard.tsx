'use client';

import {
  Check,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/Auth';
import { ApiError, postsApi } from '@/src/services/api';
import type { Post, PostPrivacy } from '@/src/types/post';
import { relativeTime } from '@/src/utils/formatDate';
import { mediaUrl } from '@/src/utils/media';

const PRIVACY_LABEL: Record<PostPrivacy, string> = {
  public: 'Public',
  followers: 'Almost private',
  private: 'Selected followers',
};

interface PostCardProps {
  post: Post;
  onUpdated?: (post: Post) => void;
  onDeleted?: (postId: string) => void;
  /** Render as the focused post on the detail page (larger content, no truncation). */
  detailed?: boolean;
}

export function PostCard({ post, onUpdated, onDeleted, detailed = false }: PostCardProps) {
  const { user } = useAuth();
  const isOwner = user?.userId === post.userId;

  const [busy, setBusy] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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
    setLikeError(null);
    const nextLiked = !post.likedByViewer;
    try {
      await (nextLiked ? postsApi.like(post.postId) : postsApi.unlike(post.postId));
      const updated = await postsApi.get(post.postId);
      onUpdated?.(updated);
    } catch {
      setLikeError('Could not update your like. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!draft.trim() || savingEdit) return;
    setSavingEdit(true);
    setActionError(null);
    try {
      const updated = await postsApi.update(post.postId, { content: draft.trim() });
      onUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    setActionError(null);
    try {
      await postsApi.remove(post.postId);
      onDeleted?.(post.postId);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not delete this post.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  async function sharePost() {
    const url = `${window.location.origin}/posts/${post.postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError('Could not copy the link. Copy it from your browser address bar instead.');
    }
  }

  const avatarUrl = mediaUrl(post.authorAvatar);
  const imageUrl = mediaUrl(post.img);

  return (
    <article className="border-b border-border bg-card p-5 transition-colors hover:bg-card/80 sm:p-6">
      <header className="flex items-start gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-brand-400">
            {post.authorName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.userId}`}
              className="truncate text-sm font-semibold hover:text-link"
            >
              {post.authorName}
            </Link>
            <span className="text-xs text-muted-foreground">· {relativeTime(post.createdAt)}</span>
          </div>
          <p className="text-xs capitalize text-muted-foreground">
            {post.groupId ? 'Group post' : PRIVACY_LABEL[post.privacy]}
          </p>
        </div>

        {isOwner && (
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="More post actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Pencil className="size-3.5" /> Edit post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {editing ? (
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={5000}
            rows={4}
            autoFocus
            className="w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 text-[15px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {actionError && <p className="mt-2 text-sm text-destructive">{actionError}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setDraft(post.content);
                setActionError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveEdit}
              disabled={savingEdit || !draft.trim()}
              className="gradient border-0 text-white"
            >
              {savingEdit ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 break-words whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
          {post.content}
        </p>
      )}

      {imageUrl && !editing && (
        <img src={imageUrl} alt="" className="mt-4 max-h-[28rem] w-full rounded-lg object-cover" />
      )}

      {confirmingDelete && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <p className="text-destructive">Delete this post? This can&apos;t be undone.</p>
          {actionError && <p className="mt-1 text-destructive">{actionError}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          disabled={busy}
          className={post.likedByViewer ? 'text-rose-400 hover:text-rose-300' : ''}
          aria-pressed={post.likedByViewer}
        >
          <Heart className={post.likedByViewer ? 'fill-current' : ''} /> {post.likeCount}
        </Button>
        {detailed ? (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm">
            <MessageCircle /> {post.commentCount}
          </span>
        ) : (
          <Link
            href={`/posts/${post.postId}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm hover:bg-muted hover:text-foreground"
          >
            <MessageCircle /> {post.commentCount}
          </Link>
        )}
        <Button variant="ghost" size="sm" onClick={sharePost} aria-label="Copy link to post">
          {copied ? <Check className="text-emerald-400" /> : <Share2 />}
          {copied ? 'Copied' : 'Share'}
        </Button>
      </div>
      {likeError && (
        <p role="alert" className="mt-2 text-right text-xs text-destructive">
          {likeError}
        </p>
      )}
    </article>
  );
}
