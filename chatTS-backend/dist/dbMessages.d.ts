interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    chatId: string;
}
export declare function saveMessageToHistory(chatId: string, message: Message): Promise<void>;
export declare function getChatHistory(chatId: string): Promise<Message[]>;
export {};
//# sourceMappingURL=dbMessages.d.ts.map