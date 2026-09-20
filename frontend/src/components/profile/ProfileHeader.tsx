'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AtSign, CalendarDays, Cake, Camera, Globe, Loader2, Lock, Mail, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ApiError, profileApi } from '@/src/services/api';
import type { FollowStatus, Profile } from '@/src/types/user';
import { Avatar } from './Avatar';
import { FollowButton } from './FollowButton';
import { VisibilityToggle } from './VisibilityToggle';

interface ProfileHeaderProps {
  profile: Profile;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onFollowChange: (status: FollowStatus) => void;
  onEdit: () => void;
  onAvatarChange: (avatar: string | undefined) => void;
  onVisibilityChange: (isPublic: boolean) => void;
}

export type TabKey = 'posts' | 'followers' | 'following';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ProfileHeader({
  profile,
  activeTab,
  onTabChange,
  onFollowChange,
  onEdit,
  onAvatarChange,
  onVisibilityChange,
}: ProfileHeaderProps) {
  const { user, isOwner, canView } = profile;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setUploading(true);
    setAvatarError(null);
    try {
      onAvatarChange(await profileApi.uploadAvatar(file));
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setAvatarError(null);
    try {
      await profileApi.removeAvatar();
      onAvatarChange(undefined);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : 'Could not remove the photo.');
    } finally {
      setUploading(false);
    }
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'posts', label: 'Posts', count: profile.posts?.length ?? 0 },
    { key: 'followers', label: 'Followers', count: profile.followerCount },
    { key: 'following', label: 'Following', count: profile.followingCount },
  ];

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-white/10">
      <div className="gradient relative h-32 sm:h-40">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="px-5 pb-0 sm:px-8">
        <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar user={user} size="lg" className="ring-4 ring-card" />

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    aria-label="Change profile photo"
                    className="gradient absolute right-0 bottom-1 flex h-8 w-8 items-center justify-center rounded-full text-white ring-2 ring-card transition-transform hover:scale-105 disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </>
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-2xl font-semibold">
                {user.firstName} {user.lastName}
              </h1>
              {user.nickname && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <AtSign className="h-3.5 w-3.5" />
                  {user.nickname}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1">
            {isOwner ? (
              <>
                {user.avatar && (
                  <Button size="lg" variant="ghost" disabled={uploading} onClick={removeAvatar}>
                    <Trash2 className="h-4 w-4" />
                    Remove photo
                  </Button>
                )}
                <Button size="lg" variant="secondary" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </Button>
              </>
            ) : (
              <>
                {profile.isFollowing && (
                  <Link
                    href={`/messages/${user.userId}`}
                    className={buttonVariants({ variant: 'secondary', size: 'lg' })}
                  >
                    <Mail className="h-4 w-4" />
                    Message
                  </Link>
                )}
                <FollowButton
                  userId={user.userId}
                  status={profile.followStatus}
                  onChange={onFollowChange}
                />
              </>
            )}
          </div>
        </div>

        {avatarError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {avatarError}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {canView && user.aboutMe && (
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">{user.aboutMe}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {user.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {user.isPublic ? 'Public profile' : 'Private profile'}
            </span>
                        {canView && user.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {user.email}
              </span>
            )}
            {canView && user.dob && (
              <span className="flex items-center gap-1.5">
                <Cake className="h-4 w-4" />
                Born {formatDate(user.dob)}
              </span>
            )}
            {user.createdAt && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Joined {formatDate(user.createdAt)}
              </span>
            )}
          </div>

          {isOwner && <VisibilityToggle isPublic={user.isPublic} onChange={onVisibilityChange} />}
        </div>

        {canView && (
          <nav
            className="mt-6 flex gap-1 border-t border-white/5 pt-1"
            aria-label="Profile sections"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>
                  {active && (
                    <span className="gradient absolute inset-x-3 -bottom-px h-0.5 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </section>
  );
}
