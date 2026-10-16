import type { IUserPublic } from "./auth";
import type { IChatData } from "./chats";

export type TTabType = 'chats' | 'contacts' | 'settings';

export interface IChatState{
    mode: 'view' | 'create_private' | 'create_group';
    chatId: string | null;
    chat?: IChatData | null; 
    targetUser: (IUserPublic | undefined) [] | null ;
}