import { type IMessage } from "./message";
export interface IChatData {
    id: string;
    participaints: string[];
    isGroup: boolean;
    lastMessage: IMessage | null;
}
export interface IChatDB {
    lastChatId: string;
    chats: {
        [chatId: string]: IChatData;
    };
}
export interface IChatCreateBody {
    participaints: string[];
}
//# sourceMappingURL=chats.d.ts.map