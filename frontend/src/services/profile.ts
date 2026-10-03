import { request } from './http';
import type { Profile, UpdatePasswordPayload, UpdateProfilePayload, User } from '@/src/types/user';

export const profileApi = {
  /** `id` may be a user id or the literal "me". */
  get: (id: string) => request<{ profile: Profile }>(`/api/profile/${id}`).then((r) => r.profile),

  update: (payload: UpdateProfilePayload) =>
    request<{ user: User }>('/api/profile/me', { method: 'PATCH', body: payload }).then(
      (r) => r.user
    ),

  setVisibility: (isPublic: boolean) =>
    request<{ isPublic: boolean }>('/api/profile/me/visibility', {
      method: 'PATCH',
      body: { isPublic },
    }).then((r) => r.isPublic),

  updatePassword: (payload: UpdatePasswordPayload) =>
    request<{ status: string }>('/api/profile/me/password', { method: 'PATCH', body: payload }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return request<{ avatar: string }>('/api/profile/me/avatar', {
      method: 'POST',
      body: form,
    }).then((r) => r.avatar);
  },

  removeAvatar: () => request<{ status: string }>('/api/profile/me/avatar', { method: 'DELETE' }),

  searchUsers: (query: string) =>
    request<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(query)}`).then(
      (r) => r.users
    ),

  suggestedUsers: () => request<{ users: User[] }>('/api/users/suggested').then((r) => r.users),
};
