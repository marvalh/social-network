import { request } from './http';
import type { Notification } from '@/src/types/notification';

export const notificationsApi = {
  list: () =>
    request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications'),

  markRead: (notifId: string) =>
    request<void>(`/api/notifications/${notifId}/read`, { method: 'PATCH' }),
};