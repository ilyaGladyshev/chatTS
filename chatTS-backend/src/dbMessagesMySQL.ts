import {IMessage} from './types/message';
import { pool } from './db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function saveMessageToHistory(text: string, senderId: string, chatId: string): Promise<string>{
    try {
        const query: string = 'INSERT INTO messages (chatId, senderId, text, timestamp) VALUES (?, ?, ?, ?)';
        const [result] = await pool.execute<ResultSetHeader>(query,
            [chatId, senderId, text, new Date(Date.now())]);          
        return result.insertId.toString();     
    } catch (error) {
        console.error('saveMessageToHistory error: ', error);
        throw error;    
    }
}

export async function findMessagesByChatId(chatId: string): Promise<IMessage[]>{
    try {
        const [rows, fields] = await pool.execute<(IMessage & RowDataPacket)[]>("SELECT id, chatId, " + 
            "senderId, text, timestamp from messages where chatId = :chatId",
            {chatId: chatId});
        return rows;        
    } catch (error) {
        console.error('findMessagesByChatId error:', error);
        throw error;      
    }
}