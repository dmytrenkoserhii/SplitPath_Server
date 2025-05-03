import { Role } from '@/modules/users/enums';

export interface JwtAccessPayload {
  sub: number;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  iat: number;
  exp: number;
}
