import { pool } from './db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { IChatData, IChatDB } from './types/chats';

function compressParticipats(rows: RowDataPacket[]){
    const chatsMap = new Map<number, IChatData>();
    rows.map((row: RowDataPacket) => {
        if (!chatsMap.has(row.id)){
            chatsMap.set(row.id, {
                id: row.id,
                isGroup: row.is_group,
                name: row.name,
                participants: []
            });
        }
        const chat = chatsMap.get(row.id);
        if (row.userId != null) {
            chat?.participants.push(row.userId.toString());
        }
        return chatsMap;
    });
    return Array.from(chatsMap.values());
}

export async function readAllChats(): Promise<IChatData[]> {
    try {
        const [rows, fields] = await pool.execute<(RowDataPacket)[]>("SELECT c.id, is_group, name," + 
            "p.userId from chats c " +
            "inner join participants p" +
            " on c.id = p.chatId");
        return compressParticipats(rows);        
    } catch (error) {
        console.error('readAllChats error: ', error);
        throw error;        
    }
}

export async function findChatById(id: string): Promise<IChatData | undefined>{
    try {    const [rows, fields] = await pool.execute<(RowDataPacket)[]>("SELECT id, is_group, name  from chats " +
        "where id = :id", {id: id}
    );
        if (rows.length > 0){
            return rows[0] as IChatData;
        } else {
            return undefined;
        }               
    } catch (error) {
        console.error('findChatByid error: ', error);
        throw error;
    }
}

export async function getAllParticipantsByChatById(id: string): Promise<string[] | undefined>{
    try {    const [rows, fields] = await pool.execute<(RowDataPacket)[]>("SELECT p.userId  from chats c " +
        "inner join participants p on p.chatId = c.id " + 
        "where c.id = :id", {id: id}
    );
    if (rows.length > 0){
            const result: string[] = [];
            rows.map(row => {
                result.push(row.userId);
            });
            return result;
        } else {
            return undefined;
        }               
    } catch (error) {
        console.error('findChatByid error: ', error);
        throw error;
    }
}

export async function findChatByCurrentAndTarget(currentUserId: string, targetUserId: string): Promise<IChatData|undefined>{
    try {
        const [rows, fields] = await pool.execute<(RowDataPacket)[]>("SELECT c.id, is_group, name," +
            " userId  from chats c inner join participants p1" +
            " on c.id = p1.chatId where p1.userId = :currentUserId AND c.is_group = :is_group " + 
            " and EXISTS(SELECT * FROM participants p2 where p2.chatId = p1.chatId and p2.userId = :targetUserId)", 
                {currentUserId: currentUserId.toString(),
                is_group: false,
                targetUserId:targetUserId.toString() });     
        if (rows.length > 0){
            return compressParticipats(rows)[0];
        } else {
            return undefined;
        }        
    } catch (error) {
        console.error('findChatByCurrentAndTarget error: ', error);
        throw error;        
    }
}

export async function createChat(name: string, isGroup: boolean, participants: string[] ): Promise<IChatData | undefined>{
    try {
        const query: string = 'INSERT INTO chats (is_group, name) VALUES (?, ?)';
        const [resultChat] = await pool.execute<ResultSetHeader>(query,
            [isGroup, name]);
        for (const p of participants) {
            const query: string = 'INSERT INTO participants (chatId, userId) VALUES (?, ?)';
            const [result] = await pool.execute<ResultSetHeader>(query,
                [resultChat.insertId, p]); 
        }
        return findChatById(resultChat.insertId.toString());            
    } catch (error) {
        console.error('createChat error: ', error);
        throw error;       
    }
}