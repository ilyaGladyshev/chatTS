import { IMessage } from './types/message';
export declare function saveMessageToHistory(chatId: string, message: IMessage): Promise<void>;
export declare function getChatHistory(chatId: string): Promise<IMessage[]>;
//# sourceMappingURL=dbMessages.d.ts.map