export interface Message{
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    chatId: string;
}

export interface MessagesDB{
    [chatId: string]: Message[];
}