export interface ConversationPreview {
  userId: number;
  username: string;
  avatarUrl?: string;
  lastMessage: {
    id: number;
    content: string;
    createdAt: Date;
    isRead: boolean;
    isSentByUser: boolean;
  };
  unreadCount: number;
}
