import {IMessage} from './types/message';
import { pool } from './db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function saveMessageToHistory(message: IMessage): Promise<void>{
    try {
        const query: string = 'INSERT INTO Messages (chat_id, sender_id, text, timestamp) VALUES (?, ?, ?, ?)';
        const [result] = await pool.execute<ResultSetHeader>(query,
            [message.chatId, message.senderId, message.text, new Date(message.timestamp)]);          
    } catch (error) {
        console.error('saveMessageToHistory error: ', error);
        throw error;    
    }
}

export async function findMessagesByChatId(chatId: string): Promise<IMessage[]>{
    try {
        const [rows, fields] = await pool.execute<(IMessage & RowDataPacket)[]>("SELECT id, chat_id, " + 
            "sender_id, text, timestamp from messages where chat_id = :chatId",
            {chatId: chatId});
        return rows;        
    } catch (error) {
        console.error('findMessagesByChatId error:', error);
        throw error;      
    }
}