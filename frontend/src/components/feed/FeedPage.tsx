'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/Auth';
import { useSocket } from '@/src/context/Socket';
import { ApiError, postsApi } from '@/src/services/api';
import { isFollowRealtimeEvent, isPostRealtimeEvent, type Post } from '@/src/types/post';
import { FullPageSpinner } from '@/src/components/layout/FullPageSpinner';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';

export function FeedPage() {
  const { user, loading } = useAuth();
  const { subscribe } = useSocket();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadedRows, setLoadedRows] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!user) return;
    postsApi
      .feed()
      .then((initial) => {
        setPosts(initial);
        setLoadedRows(initial.length);
        setHasMore(initial.length === 20);
      })
      .catch(() => setError('We could not load your feed.'))
      .finally(() => setLoadingPosts(false));
  }, [loading, user, router]);

  useEffect(
    () =>
      subscribe((data) => {
        if (isFollowRealtimeEvent(data) && data.action === 'unfollowed') {
          setPosts((current) => current.filter((post) => post.userId !== data.followeeId));
          return;
        }
        if (!isPostRealtimeEvent(data)) return;
        if (data.action === 'deleted') {
          setPosts((current) => current.filter((post) => post.postId !== data.postId));
          return;
        }

        postsApi
          .get(data.postId)
          .then((updated) => {
            if (updated.groupId) return;
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
    [subscribe]
  );

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await postsApi.feed(loadedRows);
      setPosts((current) => {
        const existingIds = new Set(current.map((post) => post.postId));
        return [...current, ...more.filter((post) => !existingIds.has(post.postId))];
      });
      setLoadedRows((current) => current + more.length);
      setHasMore(more.length === 20);
    } catch {
      setError('We could not load more posts.');
    } finally {
      setLoadingMore(false);
    }
  }

  function handleUpdated(updated: Post) {
    setPosts((current) => current.map((post) => (post.postId === updated.postId ? updated : post)));
  }

  function handleDeleted(postId: string) {
    setPosts((current) => current.filter((post) => post.postId !== postId));
  }

  if (loading || !user) return <FullPageSpinner />;

  return (
    <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[minmax(0,38rem)_17rem]">
      <main className="min-w-0 overflow-hidden rounded-xl border border-border shadow-2xl shadow-black/10">
        <div className="border-b border-border bg-card px-5 pt-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">
            Your network
          </p>
          <h1 className="mt-1 pb-5 text-2xl font-semibold tracking-tight">
            The latest from your circle
          </h1>
        </div>
        <PostComposer onCreated={(post) => setPosts((current) => [post, ...current])} />
        {loadingPosts ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading your feed...</div>
        ) : error && posts.length === 0 ? (
          <div className="p-10 text-center text-sm text-destructive">{error}</div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">Your feed is quiet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Share the first update and start the conversation.
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
      </main>
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-5">
          <section className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Welcome, {user.firstName}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keep your circle close with small, real updates.
            </p>
          </section>
          <p className="px-1 text-xs text-muted-foreground"></p>
        </div>
      </aside>
    </div>
  );
}
