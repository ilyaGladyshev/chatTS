import fs from 'fs/promises';
import path from 'path';
import {IMessage, IMessagesDB} from './types/message';

const FILE_PATH = path.join(__dirname, 'message.json');

async function readMessagesFile(): Promise<IMessagesDB> {
    try {
        const data = await fs.readFile(FILE_PATH, 'utf-8'); 
        return JSON.parse(data);       
    } catch (error: any) {
      if (error.code === 'ENOENT') return {};
      throw error;  
    }
}

async function writeMessageFile(data: IMessagesDB): Promise<void>{
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await fs.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log("Сообщения сохранены в файл " + FILE_PATH);        
    } catch (error: any) {
        console.log("Не удалось записать сообщения в файл: " + error.message);          
    }

}

export async function saveMessageToHistory(chatId: string, message: IMessage): Promise<void>{
    const db: IMessagesDB = await readMessagesFile();
    if (!db[chatId]){
        db[chatId] = [];
    }
    db[chatId].push(message);
    await writeMessageFile(db);
}

export async function getChatMessages(chatId: string): Promise< IMessage[]>{
    const db: IMessagesDB = await readMessagesFile();
    return db[chatId] || [];
}