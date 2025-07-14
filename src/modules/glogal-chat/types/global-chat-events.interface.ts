import { GlobalChatMessage } from '../entities';

export interface GlobalChatEmitEvents {
  new_global_message: (payload: GlobalChatMessage) => void;
}
