import { IUserProfile, IAuthResponse, IUserPublic } from './types/auth';
import bcryptjs from "bcryptjs";
import { generateToken } from './jwt';
import { pool } from './db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

async function hashPassword(password: string){
    if (!password) return '';
    return await bcryptjs.hash(password, 10);
}

export async function readUsersFile(): Promise<string[]|null> {
    try {
        const result: string[] = [];
        const rows = await pool.query("SELECT * from users"); 
        for (const row in rows){
            result.push(row);
        }
        if (result) return result;
            else return null;
    } catch (error: any) {
      console.error('readUsersFile error: ', error)
      if (error.code === 'ENOENT') return null;
      throw error;  
    }
}

export async function getLogins(): Promise<IUserPublic[]>{
    try {
        const query = "SELECT id, login, CONCAT_WS(' ', firstName, lastName) AS userName from users";
        const [rows, fields] = await pool.execute<RowDataPacket[]>(query); 
        return rows as IUserPublic[];          
    } catch (error) {
        console.error('getLogins error: ', error)
        throw error;        
    }    
}

export async function findUserBylogin(login: string, password: string): Promise<IAuthResponse|undefined>{
    try {
        const lowerLogin: string = login.toString().toLowerCase();
        const [rows, fields] = await pool.execute<RowDataPacket[]>("SELECT id, login, firstName, " +
            "lastName, passwordHash from users where login = :lowerLogin LIMIT 1",
            {lowerLogin: lowerLogin});
        if (!rows.length) return {status: 'not_found', error: 'Пользователь не найден'};
        const user = rows[0] as IUserProfile | undefined;
        if (user){
            const currentHash = user.passwordHash;
            if (currentHash){
                const isMatch: boolean = await bcryptjs.compare(password, currentHash);
                if (isMatch) { 
                    const token = generateToken({ id: user.id}); 
                    return {status: 'success', 
                        user: {id: user.id, token: token, firstName: user.firstName, lastName: user.lastName, login: user.login}}
                    };
                }
            } else{
                return {status: 'wrong_password', error: 'Неверный пароль'};
            } 
        } catch (error) {
            console.error('findUserBylogin error: ', error);
            throw error;        
        }
}

export async function findUserByloginOnly(login: string): Promise<IAuthResponse|undefined>{
    try {
        if (!login) return  {status: 'not_found', error: 'Логин не найден'};
        const lowerLogin: string = login.toString().toLowerCase();
        const [rows, fields] = await pool.execute<(IUserProfile & RowDataPacket)[]>("SELECT id, login, firstName, lastName, passwordHash from users where login = :lowerLogin LIMIT 1",
            {lowerLogin:lowerLogin});
        if (!rows.length)  return { status: 'not_found', error: 'Пользователь не найден' };
        const user: IUserProfile = rows[0];
        if (user){
            const {passwordHash, ...dataForReturn} = user;
            return { status:"success", ...dataForReturn};
        } else return  {status: 'not_found', error: 'Логин не найден'};       
    } catch (error) {
        console.error('findByUserOnlyError: ', error); 
        throw error;      
    }

} 

export async function findUserById(id: string): Promise<IAuthResponse|undefined>{
    try {
        if (!id) return  {status: 'not_found', error: 'ID не найден'};
        const [rows, fields] = await pool.execute<(IUserProfile & RowDataPacket)[]>("SELECT id, login," + 
            " firstName, lastName, passwordHash from users where id = :id LIMIT 1",
            {id: id});
        if (!rows.length) Error("Пользователь не найден");
        const user: IUserProfile = rows[0];
        if (user){
            const {passwordHash, ...dataForReturn} = user;
            return { status:"success", ...dataForReturn};
        } else return  {status: 'not_found', error: 'Логин не найден'};        
    } catch (error) {
        console.error('findByUserId error:', error);
        throw error;    
    }
} 

export async function createUser(login: string, firstName: string, lastName: string, 
    password: string): Promise<IUserProfile | null>{
        try {
            const lowerLogin: string = login.toLowerCase().trim();
            const passwordHash = await hashPassword(password);
            const query: string = 'INSERT INTO Users (login, firstName, lastName, ' +
            'passwordHash) VALUES (?, ?, ?, ?)';
            const [result] = await pool.execute<ResultSetHeader>(query,
                [lowerLogin, firstName, lastName, passwordHash]);        
            const token = generateToken({ id: result.insertId.toString()}); 
            const user: IUserProfile = {
                id: result.insertId.toString(),
                login: lowerLogin, 
                firstName : firstName,
                lastName : lastName,
                token: token
            }
            return user;	           
        } catch (error) {
           console.error('createUser error', error);
           throw error;
        }
    };