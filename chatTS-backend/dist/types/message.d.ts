export interface IMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    chatId: string;
}
export interface IMessagesDB {
    [chatId: string]: IMessage[];
}
//# sourceMappingURL=message.d.ts.map