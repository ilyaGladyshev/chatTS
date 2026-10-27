import * as http from 'http';
import {URL} from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import {IAuthResponse, IUserProfile, IUserPublic, IUsersDB} from "./types/auth";
import { findUserBylogin, createUser, findUserByloginOnly, findUserById, readUsersFile, getLogins } from './dbUsersMySQL';
import { readAllChats, findChatByCurrentAndTarget, findChatById, createChat, getAllParticipantsByChatById } from './dbChatsMySQL';
import {saveMessageToHistory, findMessagesByChatId} from "./dbMessagesMySQL";
import { IChatData } from './types/chats';
import { IMessage } from './types/message';
import { verifyToken } from './jwt';
import * as dotenv from 'dotenv';

const PORT = 5000;
const jsonHeader = { 'Content-Type': 'application/json; charset=utf-8'};
dotenv.config(); 

function getRequestBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});    
            } catch (error) {
                reject(new Error('Невалидный JSON'))    
            }
        });
    });    
}

function authEndpoint(req: http.IncomingMessage, res: http.ServerResponse){
    let faile = false;
    const authHeader: string = req.headers['authorization'] as string;
    const token = authHeader && authHeader.split(' ')[1];
    const decodedUser = verifyToken(token);
    if (!decodedUser){
        faile = true;
    }
    return {faile, decodedUser};   
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const allowedOrigin = 'http://localhost:3000';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    try {
        if(req.method === 'POST' && pathname === '/api/chats/find_chat_by_id'){
            const chatId: string = url.searchParams.get('chatId') || 'chat_general';
            const existingChat: IChatData|undefined = await findChatById(chatId);
            res.writeHead(200, jsonHeader);
            if (existingChat){
                return res.end(JSON.stringify(existingChat));
            } else{
               return res.end(JSON.stringify({status: 'not_found'}));                
            }
        } else if(req.method === 'POST' && pathname === '/api/chats/find_chat'){
            const {faile} = authEndpoint(req, res);
            if (faile) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ error: "Токен невалиден или просрочен"}));
            };    
            const {currentUserId, targetUserId} = await getRequestBody(req);
            const existingChat: IChatData|undefined = await findChatByCurrentAndTarget(currentUserId, targetUserId);
            res.writeHead(200, jsonHeader);
            if (existingChat){
                return res.end(JSON.stringify({status: 'found', chatId: existingChat.id}));
            } else{
               return res.end(JSON.stringify({status: 'not_found'}));                
            }
        } else if(req.method === 'POST' && pathname === '/api/chats/create'){
            const {faile} = authEndpoint(req, res);
            if (faile) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ error: "Токен невалиден или просрочен"}));
            };             
            const {name, isGroup, participants} = await getRequestBody(req);
            const chats: IChatData | undefined = await createChat(name, isGroup, participants); 
            if (!chats) return;
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(chats));                     
        } else if(req.method === 'GET' && pathname === '/api/chats/history_group'){
            const {faile} = authEndpoint(req, res);
            if (faile) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ error: "Токен невалиден или просрочен"}));
            }; 
            const chats: IChatData[] = await readAllChats(); 
            const chatsWithLastMessage = await Promise.all(Object.values(chats).map(async (chat: IChatData) => {
                const history: IMessage[] = await findMessagesByChatId(chat.id);
                const lastMessage = history.length > 0 ? history[history.length - 1] : null;               
                return {
                    ...chat,
                    lastMessage: lastMessage
                };
            }));       
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(chatsWithLastMessage));
        } else if(req.method === 'POST' && pathname === '/api/messages/create'){
            const {faile} = authEndpoint(req, res);
            if (faile) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ error: "Токен невалиден или просрочен"}));
            };
            const {text, timestamp, senderId, chatId} = await getRequestBody(req); 
            const newMessage: IMessage = {
                senderId,
                text,
                timestamp,
                chatId                
            }          
            const id = await saveMessageToHistory(newMessage.text, newMessage.senderId, newMessage.chatId);
            newMessage.id = id;
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(newMessage));
        } else if(req.method === 'GET' && pathname === '/api/messages/history'){
            const {faile} = authEndpoint(req, res);
            if (faile) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ error: "Токен невалиден или просрочен"}));
            };          
            const chatId: string = url.searchParams.get('chatId') || 'chat_general';
            const history: IMessage[] = await findMessagesByChatId(chatId);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(history));
        } else if (req.method === 'POST' && pathname === '/api/auth/login'){
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
        } else if (req.method === 'GET' && pathname === '/api/auth/me')  {
            const {faile , decodedUser} = authEndpoint(req, res);
            if ((faile) || (!decodedUser))  {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ error: "Токен невалиден или просрочен"}));
            };              
            const user = await findUserById(decodedUser.id);
            if (!user){
                res.writeHead(404, jsonHeader);
                return res.end(JSON.stringify({ error: "Пользователь не найден"}));
            }
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify({status: 'success', user}));
        }  else if(req.method === 'POST' && pathname === '/api/auth/register'){
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
            const newUser: IUserProfile | null = await createUser(login, firstName, lastName, password);
            res.writeHead(201, jsonHeader);
            return res.end(JSON.stringify({
                success: true,
                user: newUser
            })); 
        } else if (req.method === 'GET' && pathname === '/api/auth/users')  {
            const users: IUserPublic[] = await getLogins();
            const logins: string[] = [];
            users.map((u) => {
                if (u.login) logins.push(u.login)}
            );                   
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(logins));
        } else if (req.method === 'GET' && pathname === '/api/auth/usersName')  {
            const users: IUserPublic[] = await getLogins();                    
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(users));
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

wss.on('connection', async (socket, req) =>  {
    console.log('Новое WebSocket соединение установлено!');
    const baseUrl = `http://${req.headers.host}`;
    const url = new URL(req.url || '',  baseUrl);
    const token = url.searchParams.get('token');
    const decodedUser = verifyToken(token || '');
    if (!decodedUser){
        console.error("Попытка несанкционированного доступа!");
        socket.close(4001, 'Несанкционированный доступ');
        return;
    }    
    let currentUserId: string | undefined = decodedUser?.id;
    socket.on("message", async (rawData) => {
        try {
            const packet = JSON.parse(rawData.toString());
            if (packet.type === 'auth'){
                currentUserId = currentUserId;
                clients.set(decodedUser.id.toString(), socket);
                console.log(`Пользователь ${decodedUser.id} успешно подключился!`);
            }
            else if (packet.type === 'message'){
                const {text, senderId, chatId} = packet;
                try {

                    const messageId = saveMessageToHistory(text, senderId, chatId);

                    const participants = await getAllParticipantsByChatById(chatId);
                    if (!participants || participants.length === 0) {
                    return;
                    }

                    const packetToSend = JSON.stringify({
                    type: 'new_message',
                    data: {
                        id: messageId,
                        senderId,
                        text,
                        timestamp: Date.now(),
                        chatId,
                    },
                    });
                    for (const participantId of participants) {                    
                        const recipientSocket = clients.get(participantId.toString());
                        if (
                            recipientSocket &&
                            recipientSocket.readyState === WebSocket.OPEN
                        ) {
                            recipientSocket.send(packetToSend);
                        }
                    }
                } catch (error) {
                    console.error('Ошибка при обработке сообщения:', error);
                }
            }
        } catch (error) {
            console.error('Ошибка обработки пакета', error);    
        }
    });

    socket.on('close', () => {
        console.log('Соединение закрыто!');
        if (currentUserId){
            clients.delete(currentUserId);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('ЧАТ-БЭКЕНД НА TYPESCRIPT ЗАПУЩЕН!');
    console.log(`Слушает порт http://0.0.0.0:${PORT}`);
    console.log('========================================');    
})
