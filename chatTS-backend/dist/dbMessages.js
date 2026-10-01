"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMessageToHistory = saveMessageToHistory;
exports.getChatHistory = getChatHistory;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const FILE_PATH = path_1.default.join(__dirname, 'message.json');
async function readMessagesFile() {
    try {
        const data = await promises_1.default.readFile(FILE_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return {};
        throw error;
    }
}
async function writeMessageFile(data) {
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await promises_1.default.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log("Сообщения сохранены в файл " + FILE_PATH);
    }
    catch (error) {
        console.log("Не удалось записать сообщения в файл: " + error.message);
    }
}
async function saveMessageToHistory(chatId, message) {
    const db = await readMessagesFile();
    if (!db[chatId]) {
        db[chatId] = [];
    }
    db[chatId].push(message);
    await writeMessageFile(db);
}
async function getChatHistory(chatId) {
    const db = await readMessagesFile();
    return db[chatId] || [];
}
//# sourceMappingURL=dbMessages.js.map