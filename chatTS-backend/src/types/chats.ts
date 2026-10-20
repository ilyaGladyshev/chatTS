import { type IMessage } from "./message";
export interface IChatData{
    id: string;
    participants: string[];
    isGroup: boolean;
    lastMessage?: IMessage | null;
    name?: string;
}

export interface IChatDB{
    lastChatId: string,
    chats: {[chatId: string]: IChatData};
}

export interface IChatCreateBody{
    participants: string[];
}