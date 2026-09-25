import fs from 'fs/promises';
import path from 'path';
import {Message, MessagesDB} from './types/message';

const FILE_PATH = path.join(__dirname, 'message.json');

async function readMessagesFile(): Promise<MessagesDB> {
    try {
        const data = await fs.readFile(FILE_PATH, 'utf-8'); 
        return JSON.parse(data);       
    } catch (error: any) {
      if (error.code === 'ENOENT') return {};
      throw error;  
    }
}

async function writeMessageFile(data: MessagesDB): Promise<void>{
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await fs.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log("Сообщения сохранены в файл " + FILE_PATH);        
    } catch (error: any) {
        console.log("Не удалось записать сообщения в файл: " + error.message);          
    }

}

export async function saveMessageToHistory(chatId: string, message: Message): Promise<void>{
    const db = await readMessagesFile();
    if (!db[chatId]){
        db[chatId] = [];
    }
    db[chatId].push(message);
    await writeMessageFile(db);
}

export async function getChatHistory(chatId: string): Promise<Message[]>{
    const db = await readMessagesFile();
    return db[chatId] || [];
}