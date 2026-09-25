import fs from 'fs/promises';
import path from 'path';
import { UserProfile, UsersDB } from './types/auth';
import bcryptjs from "bcryptjs";

const FILE_PATH = path.join(__dirname, 'users.json');

async function hashPassword(password: string){
    if (!password) return '';
    return await bcryptjs.hash(password, 10);
}

async function readUsersFile(): Promise<UsersDB> {
    try {
        const data = await fs.readFile(FILE_PATH, 'utf-8'); 
        return JSON.parse(data);       
    } catch (error: any) {
      if (error.code === 'ENOENT') return {};
      throw error;  
    }
}

async function writeUsersFile(data: UserProfile[]): Promise<void>{
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await fs.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log("Пользователи сохранены в файл " + FILE_PATH);        
    } catch (error: any) {
        console.log("Не удалось записать пользователей в файл: " + error.message);        
    }
}
export async function findUserBylogin(login: string, password: string){
    if (!login) return null;
    const users = await readUsersFile();
    const lowerLogin = login.toString().toLowerCase();
    const user = users[lowerLogin];
    if (user){
        const currentHash = user.passwordHash;
        const isMatch = await bcryptjs.compare(password, currentHash);
        if (isMatch) {
            const {passwordHash, ...dataForReturn} = user;     
            return {status: 'exists', ...dataForReturn};
        } else{
            return {status: 'wrong_password', error: 'Неверный пароль'};
        }
    }    
    return {response: {status: 'not_found', error: 'Логин не найден'}};
}

export async function findUserByloginOnly(login: string){
    if (!login) return null;
    const users = await readUsersFile();
    const lowerLogin = login.toString().toLowerCase();
    const user = users[lowerLogin];
    if (user){
        const {passwordHash, ...dataForReturn} = user;
        return { ...dataForReturn};
    }    
    return null;
}