"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readChatsFile = readChatsFile;
exports.findChatByCurrentAndTarget = findChatByCurrentAndTarget;
exports.createChat = createChat;
exports.getChatHistory = getChatHistory;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const FILE_PATH = path_1.default.join(__dirname, 'chats.json');
async function readChatsFile() {
    try {
        const data = await promises_1.default.readFile(FILE_PATH, 'utf-8');
        if (data)
            return JSON.parse(data);
        else
            return { lastChatId: "0", chats: {} };
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return { lastChatId: "0", chats: {} };
        throw error;
    }
}
async function writeChatsFile(data) {
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await promises_1.default.writeFile(FILE_PATH, jsonString, 'utf-8');
    }
    catch (error) {
        console.log("Не удалось записать чаты в файл: " + error.message);
    }
}
async function findChatByCurrentAndTarget(currentUserId, targetUserId) {
    const db = await readChatsFile();
    if (Object.keys(db.chats).length > 0) {
        const existingChat = Object.values(db.chats).find(chat => {
            return !chat.isGroup && chat.participaints.includes(currentUserId)
                && chat.participaints.includes(targetUserId);
        });
        console.log(existingChat);
        return existingChat;
    }
    else {
        console.log("empty");
        return undefined;
    }
}
async function createChat(participaints) {
    let isGroup = false;
    if (participaints.length > 2)
        isGroup = true;
    const db = await readChatsFile();
    const id = (Number.parseInt(db.lastChatId) + 1).toString();
    db.chats[id] = {
        id: id,
        isGroup: isGroup,
        participaints: participaints,
        lastMessage: null
    };
    db.lastChatId = id;
    await writeChatsFile(db);
    console.log(db.chats[id]);
    return db.chats[id];
}
async function getChatHistory() {
    const db = await readChatsFile();
    return db || [];
}
//# sourceMappingURL=dbChats.js.map