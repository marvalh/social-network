'use client';

import { ArrowLeft, ImagePlus, Loader2, MessageCircle, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ApiError, postsApi } from '@/src/services/api';
import { useSocket } from '@/src/context/Socket';
import { isPostRealtimeEvent, type Comment, type Post } from '@/src/types/post';
import { CommentItem } from '@/src/components/feed/CommentItem';
import { PostCard } from '@/src/components/feed/PostCard';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { subscribe } = useSocket();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [imgKey, setImgKey] = useState<string | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    params.then(({ id }) =>
      Promise.all([postsApi.get(id), postsApi.comments(id)])
        .then(([loadedPost, loadedComments]) => {
          setPost(loadedPost);
          setComments(loadedComments);
        })
        .catch(() => setLoadError('This post is unavailable.'))
    );
  }, [params]);

  useEffect(() => {
    if (!post) return;
    return subscribe((data) => {
      if (!isPostRealtimeEvent(data) || data.postId !== post.postId) return;
      if (data.action === 'deleted') {
        router.replace('/');
        return;
      }

      Promise.all([postsApi.get(post.postId), postsApi.comments(post.postId)])
        .then(([updatedPost, updatedComments]) => {
          setPost(updatedPost);
          setComments(updatedComments);
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 404) router.replace('/');
        });
    });
  }, [post, router, subscribe]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError('Only JPEG, PNG, or GIF images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFormError('Images must be 5MB or smaller.');
      return;
    }

    setFormError(null);
    setUploading(true);
    setImgPreview(URL.createObjectURL(file));
    try {
      const { img } = await postsApi.uploadImage(file);
      setImgKey(img);
    } catch {
      setFormError('That image could not be uploaded.');
      setImgPreview(null);
      setImgKey(null);
    } finally {
      setUploading(false);
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!post || !content.trim() || uploading) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const comment = await postsApi.comment(post.postId, {
        content: content.trim(),
        img: imgKey ?? undefined,
      });
      setComments((current) => [...current, comment]);
      setPost((current) =>
        current ? { ...current, commentCount: current.commentCount + 1 } : current
      );
      setContent('');
      setImgKey(null);
      setImgPreview(null);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Your comment could not be added.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCommentUpdated(updated: Comment) {
    setComments((current) => current.map((c) => (c.commentId === updated.commentId ? updated : c)));
  }

  function handleCommentDeleted(commentId: string) {
    setComments((current) => current.filter((c) => c.commentId !== commentId));
    setPost((current) =>
      current ? { ...current, commentCount: Math.max(0, current.commentCount - 1) } : current
    );
  }

  function handlePostUpdated(updated: Post) {
    setPost(updated);
  }

  function handlePostDeleted() {
    router.replace('/');
  }

  if (!post && !loadError) return <FullPageSpinner />;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to feed
        </Link>
        {loadError ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-destructive">
            {loadError}
          </div>
        ) : (
          post && (
            <div className="overflow-hidden rounded-xl border border-border">
              <PostCard
                post={post}
                detailed
                onUpdated={handlePostUpdated}
                onDeleted={handlePostDeleted}
              />
              <section className="bg-card p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle className="size-4 text-brand-400" /> {comments.length}{' '}
                  {comments.length === 1 ? 'comment' : 'comments'}
                </div>

                <form onSubmit={addComment}>
                  <div className="flex gap-2">
                    <input
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Add a comment..."
                      maxLength={2000}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Comment"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || Boolean(imgKey)}
                      aria-label="Attach an image"
                    >
                      <ImagePlus />
                    </Button>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!content.trim() || submitting || uploading}
                      aria-label="Send comment"
                    >
                      <Send />
                    </Button>
                  </div>

                  {imgPreview && (
                    <div className="relative mt-2 w-fit">
                      <img
                        src={imgPreview}
                        alt="Selected upload preview"
                        className="max-h-40 rounded-lg border border-border object-cover"
                      />
                      {uploading && (
                        <div className="absolute inset-0 grid place-items-center rounded-lg bg-background/60">
                          <Loader2 className="size-5 animate-spin text-brand-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setImgKey(null);
                          setImgPreview(null);
                        }}
                        aria-label="Remove image"
                        className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-background text-foreground shadow ring-1 ring-border hover:bg-muted"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                  {formError && <p className="mt-2 text-sm text-destructive">{formError}</p>}
                </form>

                <div className="mt-5 space-y-0">
                  {comments.length === 0 ? (
                    <p className="border-t border-border py-4 text-center text-sm text-muted-foreground">
                      No comments yet. Be the first to say something.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <CommentItem
                        key={comment.commentId}
                        comment={comment}
                        onUpdated={handleCommentUpdated}
                        onDeleted={handleCommentDeleted}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>
          )
        )}
      </div>
    </main>
  );
}
