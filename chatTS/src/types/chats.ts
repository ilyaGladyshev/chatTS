import { type Message } from "./message";
export interface IChatData{
    id: string;
    participaints: string[];
    isGroup: boolean;
    lastMessage: Message | null;
}

export interface IChatDB{
    lastChatId: string,
    chats: {[chatId: string]: IChatData};
}