"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const url_1 = require("url");
const ws_1 = require("ws");
const dbMessages_1 = require("./dbMessages");
const dbUsers_1 = require("./dbUsers");
const dbChats_1 = require("./dbChats");
const PORT = 5000;
const jsonHeader = { 'Content-Type': 'application/json; charset=utf-8' };
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunck => body += chunck.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch (error) {
                reject(new Error('Невалидный JSON'));
            }
        });
    });
}
const server = http.createServer(async (req, res) => {
    const url = new url_1.URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    try {
        if (req.method === 'POST' && pathname === '/api/auth/login') {
            const { login, password } = await getRequestBody(req);
            if (!login) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ response: { status: 'not_found', error: "Логин не указан" } }));
            }
            if (!password) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ response: { status: 'wrong_password', error: "Пароль не указан" } }));
            }
            const responseData = await (0, dbUsers_1.findUserBylogin)(login, password);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(responseData));
        }
        else if (req.method === 'POST' && pathname === '/api/chats/find_chat') {
            const { curentUserId, targetUserId } = await getRequestBody(req);
            const existingChat = await (0, dbChats_1.findChatByCurrentAndTarget)(curentUserId, targetUserId);
            res.writeHead(200, jsonHeader);
            if (existingChat) {
                return res.end(JSON.stringify({ status: 'found', chatId: existingChat.id }));
            }
            else {
                return res.end(JSON.stringify({ status: 'not_found' }));
            }
        }
        else if (req.method === 'POST' && pathname === '/api/chats/create') {
            const { participaints } = await getRequestBody(req);
            const chats = await (0, dbChats_1.createChat)(participaints);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(Object.keys(chats.id)));
        }
        else if (req.method === 'GET' && pathname === '/api/chats/history_group') {
            const chats = await (0, dbChats_1.getChatHistory)();
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(Object.keys(chats.chats)));
            /*} else if(req.method === 'GET' && pathname === '/api/chat/history'){
                const chatId = url.searchParams.get('chatId') || 'chat_general';
                const history = await getChatHistory(chatId);
                res.writeHead(200, jsonHeader);
                return res.end(JSON.stringify(history));*/
        }
        else if (req.method === 'POST' && pathname === '/api/auth/register') {
            const { login, firstName, lastName, password } = await getRequestBody(req);
            if (!login || !firstName || !lastName) {
                res.writeHead(400, jsonHeader);
                return res.end(JSON.stringify({ error: "Заполнены не все обязательные поля" }));
            }
            const existingUser = await (0, dbUsers_1.findUserByloginOnly)(login);
            if (existingUser?.status != "not_found") {
                res.writeHead(409, jsonHeader);
                return res.end(JSON.stringify({ error: "Этот логин уже занят" }));
            }
            console.log("start add new user");
            const newUser = await (0, dbUsers_1.createUser)(login, firstName, lastName, password);
            res.writeHead(201, jsonHeader);
            return res.end(JSON.stringify({
                success: true,
                user: newUser
            }));
        }
        else if (req.method === 'GET' && pathname === '/api/auth/users') {
            const users = await (0, dbUsers_1.readUsersFile)();
            const logins = Object.keys(users.users);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(logins));
        }
        else if (req.method === 'GET' && pathname === '/api/auth/usersName') {
            const users = await (0, dbUsers_1.readUsersFile)();
            const allUsers = Object.values(users.users);
            const usersPublic = allUsers.map((user) => {
                return {
                    id: user.id,
                    userName: user.firstName + " " + user.lastName
                };
            });
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(usersPublic));
        }
        else {
            res.writeHead(404, jsonHeader);
            return res.end(JSON.stringify({ error: "Маршрут не существует" }));
        }
    }
    catch (error) {
        res.writeHead(500, jsonHeader);
        return res.end(JSON.stringify({ error: error.message || "Ошибка сервера" }));
    }
});
const wss = new ws_1.WebSocketServer({ server });
const clients = new Map;
wss.on('connection', (socket) => {
    console.log('Новое WebSocket соединение установлено!');
    let currentUserId = null;
    socket.on("message", (rawData) => {
        try {
            const packet = JSON.parse(rawData.toString());
            console.log('Получен новый пакет от клиента: ', packet);
            if (packet.type === 'auth') {
                currentUserId = packet.userId;
                clients.set(packet.userId, socket);
                console.log(`Пользователь ${packet.userId} успешно подключился!`);
            }
            else if (packet.type === 'message') {
                const { text, recipientId, senderId, chatId } = packet;
                const newMessage = {
                    id: `msg_${Date.now()}`,
                    senderId,
                    text,
                    timestamp: Date.now(),
                    chatId
                };
                (0, dbMessages_1.saveMessageToHistory)(chatId, newMessage);
                const messagePacket = JSON.stringify({
                    type: 'new_message',
                    data: newMessage
                });
                const recipientSocket = clients.get(recipientId);
                if (recipientSocket && recipientSocket.readyState) {
                    recipientSocket.send(messagePacket);
                }
                socket.send(messagePacket);
            }
        }
        catch (error) {
            console.log('Ошибка обработки пакета', error);
        }
    });
    socket.on('close', () => {
        console.log('Соединение закрыто!');
        if (currentUserId) {
            clients.delete(currentUserId);
        }
    });
});
server.listen(PORT, () => {
    console.log('========================================');
    console.log('ЧАТ-БЭКЕНД НА TYPESCRIPT ЗАПУЩЕН!');
    console.log(`Слушает порт http://localhost:${PORT}`);
    console.log('========================================');
});
//# sourceMappingURL=server.js.map