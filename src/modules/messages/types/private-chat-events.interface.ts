export interface PrivateMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
}

export interface ReadStatus {
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface TypingStatus {
  userId: string;
  receiverId: string;
  isTyping: boolean;
}

export type MessageReadPayload = {
  messageId: number;
  userId: number;
  readAt: Date;
};

export type TypingStatusChangePayload = {
  receiverId: number;
  isTyping: boolean;
};

export interface PrivateChatEmitEvents {
  new_private_message: (payload: PrivateMessage) => void;
  message_read: (payload: MessageReadPayload) => void;
  typing_status: (payload: TypingStatus) => void;
}

export interface PrivateChatListenEvents {
  typing_status_change: (payload: TypingStatusChangePayload) => void;
}
