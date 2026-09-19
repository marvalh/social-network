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