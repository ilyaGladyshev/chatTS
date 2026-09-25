import * as http from 'http';
import {URL} from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import {AuthResponse} from "./types/auth";
import { saveMessageToHistory, getChatHistory } from './dbMessages';
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
    console.log("Получен новый запрос " + pathname);
    try {
        if (req.method === 'POST' && pathname === '/api/auth/login'){
            const {login, password} = await getRequestBody(req);
            if (login === 'ilya' && password === '123'){
                const responseData: AuthResponse = {
                    status: 'success',
                    user: {
                        id: "usr_1",
                        login: "ilya",
                        firstName: "Илья",
                        lastName: "Гладышев"                    
                    }
                };
                res.writeHead(200, jsonHeader);
                return res.end(JSON.stringify(responseData));
            } else if (login === 'boris' && password === '123'){
                const responseData: AuthResponse = {
                    status: 'success',
                    user: {
                        id: "usr_2",
                        login: "boris",
                        firstName: "Борис",
                        lastName: "Бритва"                    
                    }
                };
                res.writeHead(200, jsonHeader);
                return res.end(JSON.stringify(responseData));
            } else {
                const errorData: AuthResponse = {
                    status: "wrong_password",
                    error: "Неверное имя пользователя или пароль"
                };
                res.writeHead(401, jsonHeader);
                return res.end(JSON.stringify(errorData));
            }
        } else if(req.method === 'GET' && pathname === '/api/chat/history'){
            const chatId = url.searchParams.get('chatId') || 'chat_general';
            const history = await getChatHistory(chatId);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(history));
        }else {
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
                const newMessage ={
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
