import type { IUserPublic } from "./auth";

export type TTabType = 'chats' | 'contacts' | 'settings';

export interface IChatState{
    mode: 'view' | 'create';
    chatId: string | null;
    targetUser: IUserPublic | null;
}