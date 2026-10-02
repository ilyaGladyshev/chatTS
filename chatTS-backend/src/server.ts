import * as http from 'http';
import {URL} from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import {IAuthResponse, IUserProfile, IUserPublic, IUsersDB} from "./types/auth";
import { saveMessageToHistory} from './dbMessages';
import { findUserBylogin, createUser, findUserByloginOnly, readUsersFile } from './dbUsers';
import { getChatHistory, findChatByCurrentAndTarget, createChat } from './dbChats';
import {getChatMessages} from "./dbMessages";
import { IChatData, IChatDB } from './types/chats';
const PORT = 5000;
const jsonHeader = { 'Content-Type': 'application/json; charset=utf-8'};

function getRequestBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunck => body += chunck.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});    
            } catch (error) {
                reject(new Error('Невалидный JSON'))    
            }
        });
    });    
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    try {
        if (req.method === 'POST' && pathname === '/api/auth/login'){
            const {login, password} = await getRequestBody(req);
             if (!login){
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({response: {status: 'not_found', error: "Логин не указан"}}));
            }
            if (!password){
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({response: {status: 'wrong_password', error: "Пароль не указан"}}));
            }        
            const responseData = await findUserBylogin(login, password);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(responseData));
        } else if(req.method === 'POST' && pathname === '/api/chats/find_chat'){
            const {currentUserId, targetUserId} = await getRequestBody(req);
            const existingChat: IChatData|undefined = await findChatByCurrentAndTarget(currentUserId, targetUserId);
            res.writeHead(200, jsonHeader);
            if (existingChat){
                return res.end(JSON.stringify({status: 'found', chatId: existingChat.id}));
            } else{
               return res.end(JSON.stringify({status: 'not_found'}));                
            }
        } else if(req.method === 'POST' && pathname === '/api/chats/create'){
            const {participaints} = await getRequestBody(req);
            const chats: IChatData = await createChat(participaints); 
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(chats.id);                     
        } else if(req.method === 'GET' && pathname === '/api/chats/history_group'){
            const chats: IChatDB = await getChatHistory();        
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(Object.keys(chats.chats)));
        } else if(req.method === 'GET' && pathname === '/api/messages/history'){
            const chatId = url.searchParams.get('chatId') || 'chat_general';
            const history = await getChatMessages(chatId);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(history));
        } else if(req.method === 'POST' && pathname === '/api/auth/register'){
            const { login, firstName, lastName, password} = await getRequestBody(req);
            if (!login || !firstName || !lastName){
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({error: "Заполнены не все обязательные поля"}));
            }
            const existingUser: IAuthResponse | undefined = await findUserByloginOnly(login); 
            if (existingUser?.status != "not_found"){
                res.writeHead(409, jsonHeader);
                return res.end(JSON.stringify({error: "Этот логин уже занят"}));
            } 
            console.log("start add new user");  
            const newUser: IUserProfile = await createUser(login, firstName, lastName, password);
            res.writeHead(201, jsonHeader);
            return res.end(JSON.stringify({
                success: true,
                user: newUser
            })); 
        } else if (req.method === 'GET' && pathname === '/api/auth/users')  {
            const users: IUsersDB = await readUsersFile();
            const logins: string[] = Object.keys(users.users);                           
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(logins));
        } else if (req.method === 'GET' && pathname === '/api/auth/usersName')  {
            const users: IUsersDB = await readUsersFile();
            const allUsers: IUserProfile[] = Object.values(users.users);
            const usersPublic: IUserPublic[] = allUsers.map((user) : IUserPublic => {return {
                id: user.id,
                userName: user.firstName + " " + user.lastName
                }
            });                      
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(usersPublic));
        }
        else {
            res.writeHead(404, jsonHeader);
            return res.end(JSON.stringify({error: "Маршрут не существует"}));            
        }
    } catch (error: any) {
        res.writeHead(500, jsonHeader);
        return res.end(JSON.stringify({error: error.message || "Ошибка сервера"}));
    }
});

const wss = new WebSocketServer({server});
const clients = new Map<string, WebSocket>;

wss.on('connection', (socket) => {
    console.log('Новое WebSocket соединение установлено!');
    let currentUserId: string | null = null;
    socket.on("message", (rawData) => {
        try {
            const packet =JSON.parse(rawData.toString());
            console.log('Получен новый пакет от клиента: ', packet);
            if (packet.type === 'auth'){
                currentUserId = packet.userId;
                clients.set(packet.userId, socket);
                console.log(`Пользователь ${packet.userId} успешно подключился!`);
            }
            else if (packet.type === 'message'){
                const {text, recipientId, senderId, chatId} = packet;
                const newMessage = {
                    id: `msg_${Date.now()}`,
                    senderId,
                    text,
                    timestamp: Date.now(),
                    chatId                   
                }
                saveMessageToHistory(chatId, newMessage);
                const messagePacket = JSON.stringify({
                    type: 'new_message',
                    data: newMessage
                });
                const recipientSocket = clients.get(recipientId);
                if (recipientSocket && recipientSocket.readyState){
                    recipientSocket.send(messagePacket);
                }
                socket.send(messagePacket);
            }
        } catch (error) {
            console.log('Ошибка обработки пакета', error);    
        }
    });

    socket.on('close', () => {
        console.log('Соединение закрыто!');
        if (currentUserId){
            clients.delete(currentUserId);
        }
    });
});

server.listen(PORT, () => {
    console.log('========================================');
    console.log('ЧАТ-БЭКЕНД НА TYPESCRIPT ЗАПУЩЕН!');
    console.log(`Слушает порт http://localhost:${PORT}`);
    console.log('========================================');    
})
