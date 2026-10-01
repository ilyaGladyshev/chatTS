import { IChatData, IChatDB } from './types/chats';
export declare function readChatsFile(): Promise<IChatDB>;
export declare function findChatByCurrentAndTarget(curentUserId: string, targetUserId: string): Promise<IChatData | null>;
export declare function createChat(participaints: string[]): Promise<IChatData>;
export declare function getChatHistory(): Promise<IChatDB>;
//# sourceMappingURL=dbChats.d.ts.map