import { Friend } from '../entities';

export interface FriendsEmitEvents {
  new_friend_request: (payload: Friend) => void;
  friend_request_accepted: (payload: Friend) => void;
  friend_request_rejected: (payload: Friend) => void;
  friend_status_changed: (payload: { userId: number; isOnline: boolean }) => void;
  friend_deleted: (payload: Friend) => void;
  friend_request_resent: (payload: Friend) => void;
}
