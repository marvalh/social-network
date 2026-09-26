import { request } from './http';
import type { FollowStatus } from '@/src/types/follow';
import type { User } from '@/src/types/user';

export interface PendingFollowRequest {
  requestId: string;
  user: User;
  createdAt: string;
}

export const followApi = {
  status: (userId: string) =>
    request<{ status: FollowStatus; requestId?: string }>(`/api/users/${userId}/follow-status`),

  followers: (userId: string) =>
    request<{ followers: User[]; count: number }>(`/api/users/${userId}/followers`),

  following: (userId: string) =>
    request<{ following: User[]; count: number }>(`/api/users/${userId}/following`),

  follow: (userId: string) =>
    request<{ status: FollowStatus; requestId: string }>(`/api/users/${userId}/follow`, {
      method: 'POST',
    }),

  unfollow: (userId: string) =>
    request<{ status: FollowStatus }>(`/api/users/${userId}/follow`, { method: 'DELETE' }).then(
      (r) => r.status
    ),

  removeFollower: (userId: string) =>
    request<{ status: FollowStatus }>(`/api/followers/${userId}`, { method: 'DELETE' }).then(
      (r) => r.status
    ),

  pendingRequests: () =>
    request<{ pending: PendingFollowRequest[]; count: number }>('/api/follow-requests/pending').then(
      (r) => r.pending
    ),

  acceptRequest: (requestId: string) =>
    request<void>(`/api/follow-requests/${requestId}/accept`, { method: 'POST' }),

  declineRequest: (requestId: string) =>
    request<void>(`/api/follow-requests/${requestId}/decline`, { method: 'POST' }),

  cancelRequest: (requestId: string) =>
    request<void>(`/api/follow-requests/${requestId}`, { method: 'DELETE' }),
};