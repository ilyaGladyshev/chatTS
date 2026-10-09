import { IChatData, IChatDB } from './types/chats';
export declare function readChatsFile(): Promise<IChatDB>;
export declare function findChatById(id: string): Promise<IChatData | undefined>;
export declare function findChatByCurrentAndTarget(currentUserId: string, targetUserId: string): Promise<IChatData | undefined>;
export declare function createChat(participaints: string[]): Promise<IChatData>;
export declare function getChatHistory(): Promise<IChatDB>;
//# sourceMappingURL=dbChats.d.ts.map