import { FriendStatus } from '../enums';

interface FriendWhereCondition {
  sender?: { id: number };
  receiver?: { id: number };
  status?: FriendStatus;
}

export interface FriendRequestWhereConditions {
  where?: FriendWhereCondition[];
  sender?: { id: number };
  receiver?: { id: number };
  status?: FriendStatus;
}
