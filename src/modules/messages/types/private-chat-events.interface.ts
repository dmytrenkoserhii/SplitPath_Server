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

export type SendPrivateMessagePayload = {
  content: string;
  receiverId: string;
};

export type MessageReadPayload = {
  messageId: string;
  userId: string;
  readAt: Date;
};

export type TypingStatusChangePayload = {
  receiverId: string;
  isTyping: boolean;
};

export interface PrivateChatEmitEvents {
  new_private_message: (payload: PrivateMessage) => void;
  message_read: (payload: MessageReadPayload) => void;
  typing_status: (payload: TypingStatus) => void;
}

export interface PrivateChatListenEvents {
  send_private_message: (payload: SendPrivateMessagePayload) => void;
  mark_message_read: (payload: MessageReadPayload) => void;
  typing_status_change: (payload: TypingStatusChangePayload) => void;
}
