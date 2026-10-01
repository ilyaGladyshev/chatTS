import fs from 'fs/promises';
import path from 'path';
import { IUserProfile, IUsersDB, IAuthResponse } from './types/auth';
import bcryptjs from "bcryptjs";

const FILE_PATH = path.join(__dirname, 'users.json');

async function hashPassword(password: string){
    if (!password) return '';
    return await bcryptjs.hash(password, 10);
}

export async function readUsersFile(): Promise<IUsersDB> {
    try {
        const data = await fs.readFile(FILE_PATH, 'utf-8');  
        if (data) return JSON.parse(data)
        else return {lastId: '0', users: {}};
    } catch (error: any) {
      if (error.code === 'ENOENT') return {lastId: '0', users:{},};
      throw error;  
    }
}

async function writeUsersFile(data: IUserProfile[]): Promise<void>{
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await fs.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log("Пользователи сохранены в файл " + FILE_PATH);        
    } catch (error: any) {
        console.log("Не удалось записать пользователей в файл: " + error.message);        
    }
}

export async function findUserBylogin(login: string, password: string): Promise<IAuthResponse|undefined>{
    if (!login) return {status: 'not_found', error: 'Логин не найден'};
    const usersDB: IUsersDB = await readUsersFile();
    const lowerLogin: string = login.toString().toLowerCase();
    if (usersDB.users){
        const user: IUserProfile = usersDB.users[lowerLogin];
        if (user){
            const currentHash: string | undefined = user.passwordHash;
            if (currentHash){
                const isMatch: boolean = await bcryptjs.compare(password, currentHash);
                if (isMatch) {  
                    return {status: 'success', 
                            user: {id: user.id, firstName: user.firstName, lastName: user.lastName, login: user.login}}
                        };
                }
            } else{
                return {status: 'wrong_password', error: 'Неверный пароль'};
            }       
        return {status: 'not_found', error: 'Логин не найден'};
        }
}

export async function findUserByloginOnly(login: string): Promise<IAuthResponse|undefined>{
    if (!login) return  {status: 'not_found', error: 'Логин не найден'};
    const usersDB: IUsersDB = await readUsersFile();
    const lowerLogin: string = login.toString().toLowerCase();
    if (usersDB.users){
        const user: IUserProfile = usersDB.users[lowerLogin];
        if (user){
            const {passwordHash, ...dataForReturn} = user;
            return { status:"success", ...dataForReturn};
        } else return  {status: 'not_found', error: 'Логин не найден'};
    } else return  {status: 'not_found', error: 'Логин не найден'};
} 

export async function createUser(login: string, firstName: string, lastName: string, password: string){
		const usersDB: IUsersDB = await readUsersFile();
        const lowerLogin: string = login.toLowerCase().trim();
		usersDB.users[lowerLogin] = {
            id: (Number.parseInt(usersDB.lastId) + 1).toString(),
            login: lowerLogin, 
            firstName : firstName,
			lastName : lastName,
            passwordHash: await hashPassword(password)
		};
        usersDB.lastId = usersDB.users[lowerLogin].id; 
		await writeUsers(usersDB);
        const {passwordHash, ...dataForReturn} = usersDB.users[lowerLogin];
        return {...dataForReturn};	
}

export async function writeUsers(usersObject: IUsersDB) {
    try {
        const jsonString = JSON.stringify(usersObject, null, 4);
        await fs.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log('Пользователи успешно записаны!'); 
        return true;       
    } catch (error: any) {
        console.log("Не удалось записать пользователей в файл: " + error.message);
        return false;    
    }
}