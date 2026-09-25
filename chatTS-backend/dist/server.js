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
    console.log("Получен новый запрос " + pathname);
    try {
        if (req.method === 'POST' && pathname === '/api/auth/login') {
            const { login, password } = await getRequestBody(req);
            if (login === 'ilya' && password === '123') {
                const responseData = {
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
            }
            else if (login === 'boris' && password === '123') {
                const responseData = {
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
            }
            else {
                const errorData = {
                    status: "wrong_password",
                    error: "Неверное имя пользователя или пароль"
                };
                res.writeHead(401, jsonHeader);
                return res.end(JSON.stringify(errorData));
            }
        }
        else if (req.method === 'GET' && pathname === '/api/chat/history') {
            const chatId = url.searchParams.get('chatId') || 'chat_general';
            const history = await (0, dbMessages_1.getChatHistory)(chatId);
            res.writeHead(200, jsonHeader);
            return res.end(JSON.stringify(history));
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