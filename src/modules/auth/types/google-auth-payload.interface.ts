import { User } from '@/modules/users/entities';

export interface GoogleAuthPayload extends User {
  accessToken: string;
  refreshToken: string;
}
