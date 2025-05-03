import { JwtAccessPayload } from './jwt-access-payload.interface';

export interface JwtRefreshPayload extends JwtAccessPayload {
  refreshToken: string;
}
