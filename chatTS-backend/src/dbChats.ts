import fs from 'fs/promises';
import path from 'path';
import { IChatData, IChatDB } from './types/chats';

const FILE_PATH = path.join(__dirname, 'chats.json');


export async function readChatsFile(): Promise<IChatDB> {
    try {
        const data = await fs.readFile(FILE_PATH, 'utf-8');  
        if (data) return JSON.parse(data)
        else return {lastChatId: "0", chats: {}};
    } catch (error: any) {
      if (error.code === 'ENOENT') return {lastChatId: "0", chats: {}};
      throw error;  
    }
}

async function writeChatsFile(data: IChatDB): Promise<void>{
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await fs.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log("Чаты сохранены в файл " + FILE_PATH);        
    } catch (error: any) {
        console.log("Не удалось записать чаты в файл: " + error.message);        
    }
}

export async function findChatByCurrentAndTarget(curentUserId: string, targetUserId: string): Promise<IChatData|null>{
    const db: IChatDB = await readChatsFile();
    if (Object.keys(db.chats).length >0){
        const existingChat: IChatData = Object.values(db).find(chat => {
            !chat.isGroup && chat.participaints.includes(curentUserId)
            && chat.participaints.includes(targetUserId)
        })
        return existingChat
    } else return null;
}

export async function createChat(participaints: string[] ): Promise<IChatData>{
    let isGroup: boolean = false;
    console.log(participaints);
    if (participaints.length > 2) isGroup = true; 
    const db: IChatDB = await readChatsFile();
    const id: string = (Number.parseInt(db.lastChatId) + 1).toString();
    db.chats[id] = { 
        id: id, 
        isGroup: isGroup,
        participaints: participaints,
        lastMessage: null
    };  
    db.lastChatId = id; 
    await writeChatsFile(db);
    return db.chats[id];    
}

export async function getChatHistory(): Promise<IChatDB>{
    const db: IChatDB = await readChatsFile();
    return db || [];
}