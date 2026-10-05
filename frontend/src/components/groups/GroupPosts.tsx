'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/src/components/feed/PostCard';
import { PostComposer } from '@/src/components/feed/PostComposer';
import { useSocket } from '@/src/context/Socket';
import { ApiError, postsApi } from '@/src/services/api';
import { isPostRealtimeEvent, type Post } from '@/src/types/post';

const PAGE_SIZE = 20;

export function GroupPosts({ groupId }: { groupId: string }) {
  const { subscribe } = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    postsApi
      .groupPosts(groupId)
      .then((initial) => {
        setPosts(initial);
        setHasMore(initial.length === PAGE_SIZE);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load posts.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(
    () =>
      subscribe((data) => {
        if (!isPostRealtimeEvent(data)) return;
        if (data.action === 'deleted') {
          setPosts((current) => current.filter((post) => post.postId !== data.postId));
          return;
        }

        postsApi
          .get(data.postId)
          .then((updated) => {
            if (updated.groupId !== groupId) return;
            setPosts((current) => {
              const alreadyLoaded = current.some((post) => post.postId === updated.postId);
              if (!alreadyLoaded && data.action !== 'created') return current;
              return [updated, ...current.filter((post) => post.postId !== updated.postId)].sort(
                (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
              );
            });
          })
          .catch((err: unknown) => {
            if (err instanceof ApiError && err.status === 404) {
              setPosts((current) => current.filter((post) => post.postId !== data.postId));
            }
          });
      }),
    [subscribe, groupId]
  );

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await postsApi.groupPosts(groupId, posts.length);
      setPosts((current) => {
        const existingIds = new Set(current.map((post) => post.postId));
        return [...current, ...more.filter((post) => !existingIds.has(post.postId))];
      });
      setHasMore(more.length === PAGE_SIZE);
    } catch {
      setError('We could not load more posts.');
    } finally {
      setLoadingMore(false);
    }
  }

  function handleCreated(post: Post) {
    setPosts((current) => [post, ...current.filter((p) => p.postId !== post.postId)]);
  }

  function handleUpdated(updated: Post) {
    setPosts((current) => current.map((post) => (post.postId === updated.postId ? updated : post)));
  }

  function handleDeleted(postId: string) {
    setPosts((current) => current.filter((post) => post.postId !== postId));
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Posts</h3>
      <div className="overflow-hidden rounded-xl border border-border">
        <PostComposer groupId={groupId} onCreated={handleCreated} />
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading posts...</div>
        ) : error && posts.length === 0 ? (
          <div className="p-8 text-center text-sm text-destructive">{error}</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium">No posts yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to share something with the group.
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
            {hasMore && (
              <div className="p-5 text-center">
                <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
