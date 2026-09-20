import { request } from './http';
import type { FollowStatus, User } from '@/src/types/user';

// Only what the profile page needs — the rest of the follow system
// (requests inbox, accept/decline) lives with that feature.
export const followApi = {
  status: (userId: string) =>
    request<{ status: FollowStatus }>(`/api/users/${userId}/follow-status`).then((r) => r.status),

  followers: (userId: string) =>
    request<{ followers: User[]; count: number }>(`/api/users/${userId}/followers`),

  following: (userId: string) =>
    request<{ following: User[]; count: number }>(`/api/users/${userId}/following`),

  /** Returns "pending" for private profiles, "accepted" for public ones. */
  follow: (userId: string) =>
    request<{ status: FollowStatus }>(`/api/users/${userId}/follow`, { method: 'POST' }).then(
      (r) => r.status
    ),

  unfollow: (userId: string) =>
    request<{ status: string }>(`/api/users/${userId}/follow`, { method: 'DELETE' }),

  removeFollower: (userId: string) =>
    request<{ status: string }>(`/api/followers/${userId}`, { method: 'DELETE' }),
};
