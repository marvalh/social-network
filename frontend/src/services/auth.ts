import { request } from './http';
import type { LoginPayload, Profile, RegisterPayload, User } from '@/src/types/user';

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<{ userId: string }>('/api/register', { method: 'POST', body: payload }),

  login: (payload: LoginPayload) => request<User>('/api/login', { method: 'POST', body: payload }),

  logout: () => request<void>('/api/logout', { method: 'POST' }),

  me: () => request<{ profile: Profile }>('/api/profile/me').then((res) => res.profile.user),
};
