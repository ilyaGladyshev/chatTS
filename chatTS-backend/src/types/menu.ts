import type { IUserProfile } from "./auth";

export type TTabType = 'chats' | 'contacts' | 'settings';

export interface IChatState{
    mode: 'view' | 'create';
    chatId: string | null;
    targetUser: IUserProfile | null;
}