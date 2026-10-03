import { request } from './http';
import type { Message, GroupMessage, Conversation } from '@/src/types/chat';
import type { User } from '@/src/types/user';

export const chatApi = {
  getConversation: (userId: string) =>
    request<{ messages: Message[] }>(`/api/chat/${userId}`).then((res) => res.messages),

  sendMessage: (userId: string, content: string) =>
    request<{ chatId: string }>(`/api/chat/${userId}`, {
      method: 'POST',
      body: { content },
    }),

  getGroupMessages: (groupId: string) =>
    request<{ messages: GroupMessage[] }>(`/api/chat/group/${groupId}`).then((res) => res.messages),

  sendGroupMessage: (groupId: string, content: string) =>
    request<{ chatId: string }>(`/api/chat/group/${groupId}`, {
      method: 'POST',
      body: { content },
    }),
  listConversations: () =>
    request<{ conversations: Conversation[] }>('/api/chat').then((res) => res.conversations),

  searchUsersInChat: (query: string) =>
    request<{ users: User[] }>(`/api/chat/search?q=${encodeURIComponent(query)}`).then(
      (r) => r.users
    ),
};
