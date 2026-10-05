'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/Auth';
import { ApiError, postsApi } from '@/src/services/api';
import type { Post, PostPrivacy } from '@/src/types/post';
import { mediaUrl } from '@/src/utils/media';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

const PRIVACY_LABEL: Record<PostPrivacy, string> = {
  public: 'Anyone',
  followers: 'Almost private',
  private: 'Selected followers',
};

export function PostComposer({ onCreated }: { onCreated: (post: Post) => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>('public');
  const [followers, setFollowers] = useState<{ userId: string; firstName: string; lastName: string }[]>([]);
  const [visibleToIds, setVisibleToIds] = useState<string[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [followerError, setFollowerError] = useState<string | null>(null);
  const [imgKey, setImgKey] = useState<string | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (privacy !== 'private' || !user) return;
    let active = true;
    postsApi
      .followers(user.userId)
      .then(({ followers: acceptedFollowers }) => {
        if (active) setFollowers(acceptedFollowers);
      })
      .catch(() => {
        if (active) setFollowerError('Your followers could not be loaded. Try again.');
      })
      .finally(() => {
        if (active) setLoadingFollowers(false);
      });
    return () => {
      active = false;
    };
  }, [privacy, user]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, or GIF images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Images must be 5MB or smaller.');
      return;
    }

    setError(null);
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setImgPreview(localPreview);
    try {
      const { img } = await postsApi.uploadImage(file);
      setImgKey(img);
    } catch (err) {
      setError(
      err instanceof ApiError ? err.message : 'That image could not be uploaded. Try another one.'
    );
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setImgKey(null);
    setImgPreview(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (uploading) {
      setError('Your image is still uploading. Give it a moment.');
      return;
    }
    if (!content.trim()) {
      setError('Write something to share first.');
      return;
    }
    if (privacy === 'private') {
      if (loadingFollowers) {
        setError('Your followers are still loading. Try again in a moment.');
        return;
      }
      if (followerError) {
        setError(followerError);
        return;
      }
      if (visibleToIds.length === 0) {
        setError('Pick at least one follower to share this with, or choose a different audience.');
        return;
      }
    }
    setSubmitting(true);
    setError(null);

    try {
      const post = await postsApi.create({
        content: content.trim(),
        privacy,
        img: imgKey ?? undefined,
        visibleToIds: privacy === 'private' ? visibleToIds : undefined,
      });
      onCreated(post);
      setContent('');
      clearImage();
      setPrivacy('public');
      setVisibleToIds([]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Your post could not be published. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const avatarUrl = mediaUrl(user?.avatar);
  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '';

  return (
    <form onSubmit={handleSubmit} className="border-b border-border bg-card p-5 sm:p-6">
      <div className="flex gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-11 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-orange text-sm font-semibold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (error) setError(null);
            }}
            placeholder={`What's on your mind, ${user?.firstName ?? 'there'}?`}
            maxLength={5000}
            rows={content ? 3 : 1}
            className="min-h-11 w-full resize-none rounded-lg border border-border bg-surface px-4 py-2.5 text-base outline-none transition-[min-height] placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Post content"
          />

          {imgPreview && (
            <div className="relative mt-3 w-fit">
              <img
                src={imgPreview}
                alt="Selected upload preview"
                className="max-h-64 rounded-lg border border-border object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 grid place-items-center rounded-lg bg-background/60">
                  <Loader2 className="size-6 animate-spin text-brand-400" />
                </div>
              )}
              <button
                type="button"
                onClick={clearImage}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-background text-foreground shadow ring-1 ring-border hover:bg-muted"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          {privacy === 'private' && (
            <fieldset className="mt-3 rounded-lg border border-border p-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">
                Share with followers
              </legend>
              {loadingFollowers ? (
                <p className="text-sm text-muted-foreground">Loading followers...</p>
              ) : followerError ? (
                <p className="text-sm text-destructive">{followerError}</p>
              ) : followers.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have no accepted followers yet.</p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {followers.map((follower) => (
                    <label key={follower.userId} className="flex items-center gap-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={visibleToIds.includes(follower.userId)}
                        onChange={(event) =>
                          setVisibleToIds((current) =>
                            event.target.checked
                              ? [...current, follower.userId]
                              : current.filter((id) => id !== follower.userId)
                          )
                        }
                        className="size-4 accent-primary"
                      />
                      {follower.firstName} {follower.lastName}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
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
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || Boolean(imgKey)}
                className="text-emerald-400 hover:text-emerald-300"
              >
                <ImagePlus /> Photo
              </Button>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <select
                value={privacy}
                onChange={(event) => {
                  const nextPrivacy = event.target.value as PostPrivacy;
                  if (nextPrivacy === 'private') {
                    setLoadingFollowers(true);
                    setFollowerError(null);
                  }
                  setPrivacy(nextPrivacy);
                }}
                aria-label="Post privacy"
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {(Object.keys(PRIVACY_LABEL) as PostPrivacy[]).map((value) => (
                  <option key={value} value={value}>
                    {PRIVACY_LABEL[value]}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={submitting} className="gradient border-0 text-white">
                {submitting ? 'Publishing...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
