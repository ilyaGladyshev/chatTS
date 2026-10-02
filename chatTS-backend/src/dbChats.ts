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
    } catch (error: any) {
        console.log("Не удалось записать чаты в файл: " + error.message);        
    }
}

export async function findChatByCurrentAndTarget(currentUserId: string, targetUserId: string): Promise<IChatData|undefined>{
    const db: IChatDB = await readChatsFile();
    if (Object.keys(db.chats).length >0){
            const existingChat: IChatData| undefined = Object.values(db.chats).find(chat => {
            return !chat.isGroup && chat.participaints.includes(currentUserId)
            && chat.participaints.includes(targetUserId)
        })
        console.log(existingChat);
        return existingChat;
    } else {
        console.log("empty");
        return undefined;
    }

}

export async function createChat(participaints: string[] ): Promise<IChatData>{
    let isGroup: boolean = false;
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
    console.log(db.chats[id]);
    return db.chats[id];    
}

export async function getChatHistory(): Promise< IChatDB>{
    const db: IChatDB = await readChatsFile();
    return db || [];
}
