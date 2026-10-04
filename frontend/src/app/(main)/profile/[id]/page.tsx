'use client';

import { use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { StatusError } from '@/src/components/layout/StatusError';
import { ChangePasswordModal } from '@/src/components/profile/ChangePasswordModal';
import { EditProfileModal } from '@/src/components/profile/EditProfileModal';
import { PrivateNotice } from '@/src/components/profile/PrivateNotice';
import { ProfileHeader, type TabKey } from '@/src/components/profile/ProfileHeader';
import { ProfilePostCard } from '@/src/components/profile/ProfilePostCard';
import { EmptyState, UserList } from '@/src/components/profile/UserList';
import { useProfile } from '@/src/hooks/useProfile';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { ApiError, followApi } from '@/src/services/api';
import type { FollowStatus, User } from '@/src/types/user';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { checking } = useRequireAuth();
  const { profile, loading, failure, refresh, patch } = useProfile(id);

  const [tab, setTab] = useState<TabKey>('posts');
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  if (checking || loading) {
    return <FullPageSpinner />;
  }

  if (failure || !profile) {
    return <StatusError status={failure ?? 500} onRetry={refresh} />;
  }

  const { user, isOwner, canView } = profile;

  function handleFollowChange(status: FollowStatus) {
    // Gaining or losing access flips what the server will return, so re-fetch.
    patch({ followStatus: status, isFollowing: status === 'accepted' });
    refresh();
  }

  function handleSaved(updated: User) {
    patch({ user: { ...user, ...updated } });
  }

  async function removeFollower(follower: User) {
    setRemoveError(null);
    try {
      await followApi.removeFollower(follower.userId);
      await refresh();
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
      <ProfileHeader
        profile={profile}
        activeTab={tab}
        onTabChange={setTab}
        onFollowChange={handleFollowChange}
        onEdit={() => setEditing(true)}
        onAvatarChange={(avatar) => patch({ user: { ...user, avatar } })}
        onVisibilityChange={(isPublic) => {
          patch({ user: { ...user, isPublic } });
          refresh();
        }}
      />

      {!canView ? (
        <PrivateNotice firstName={user.firstName} />
      ) : (
        <>
          {removeError && (
            <p role="alert" className="text-sm text-destructive">
              {removeError}
            </p>
          )}

          {tab === 'posts' && (
            <div className="space-y-4">
              {(profile.posts ?? []).length === 0 ? (
                <EmptyState
                  message={isOwner ? "You haven't posted anything yet." : 'No posts yet.'}
                />
              ) : (
                profile.posts?.map((post) => (
                  <ProfilePostCard key={post.postId} post={post} author={user} />
                ))
              )}
            </div>
          )}

          {tab === 'followers' && (
            <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
              <UserList
                users={profile.followers ?? []}
                emptyMessage={isOwner ? 'No one follows you yet.' : 'No followers yet.'}
                action={
                  isOwner
                    ? (follower) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFollower(follower)}
                          className="text-muted-foreground"
                        >
                          Remove
                        </Button>
                      )
                    : undefined
                }
              />
            </div>
          )}

          {tab === 'following' && (
            <div className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
              <UserList
                users={profile.following ?? []}
                emptyMessage={
                  isOwner ? "You aren't following anyone yet." : 'Not following anyone yet.'
                }
              />
            </div>
          )}
        </>
      )}

      {isOwner && (
        <>
          <EditProfileModal
            open={editing}
            user={user}
            onClose={() => setEditing(false)}
            onSaved={handleSaved}
            onChangePassword={() => {
              setEditing(false);
              setChangingPassword(true);
            }}
          />
          <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
        </>
      )}
    </main>
  );
}