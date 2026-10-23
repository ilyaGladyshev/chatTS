type TMessageStatus = 'delivered' | 'pending'

export interface IMessage{
    id?: string;
    senderId: string;
    text: string;
    timestamp: number;
    chatId: string;
    status?: TMessageStatus;
}

export interface IMessagesDB{
    [chatId: string]: IMessage[];
}