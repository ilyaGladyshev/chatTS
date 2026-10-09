import { type IMessage } from "./message";
export interface IChatData{
    id: string;
    participaints: string[];
    isGroup: boolean;
    lastMessage: IMessage | null;
    name?: string;
}

export interface IChatDB{
    lastChatId: string,
    chats: {[chatId: string]: IChatData};
}