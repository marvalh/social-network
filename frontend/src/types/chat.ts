export interface Message {
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt: { Time: string; Valid: boolean };
  createdAt: string;
}

export interface GroupMessage {
  chatId: string;
  senderId: string;
  groupId: string;
  content: string;
  readAt: { Time: string; Valid: boolean };
  createdAt: string;
}

export interface Conversation {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  lastMessage: string;
  lastMessageAt: string;
}

export function isChatMessage(data: unknown): data is Message {
  return (
    typeof data === 'object' &&
    data !== null &&
    'chatId' in data &&
    'senderId' in data &&
    'receiverId' in data
  );
}

export interface TypingEvent {
  type: 'typing';
  senderId: string;
}

export function isTypingEvent(data: unknown): data is TypingEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === 'typing' &&
    'senderId' in data
  );
}