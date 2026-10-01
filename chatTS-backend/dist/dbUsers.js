"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readUsersFile = readUsersFile;
exports.findUserBylogin = findUserBylogin;
exports.findUserByloginOnly = findUserByloginOnly;
exports.createUser = createUser;
exports.writeUsers = writeUsers;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const FILE_PATH = path_1.default.join(__dirname, 'users.json');
async function hashPassword(password) {
    if (!password)
        return '';
    return await bcryptjs_1.default.hash(password, 10);
}
async function readUsersFile() {
    try {
        const data = await promises_1.default.readFile(FILE_PATH, 'utf-8');
        if (data)
            return JSON.parse(data);
        else
            return { lastId: '0', users: {} };
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return { lastId: '0', users: {}, };
        throw error;
    }
}
async function writeUsersFile(data) {
    try {
        const jsonString = JSON.stringify(data, null, 4);
        await promises_1.default.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log("Пользователи сохранены в файл " + FILE_PATH);
    }
    catch (error) {
        console.log("Не удалось записать пользователей в файл: " + error.message);
    }
}
async function findUserBylogin(login, password) {
    if (!login)
        return { status: 'not_found', error: 'Логин не найден' };
    const usersDB = await readUsersFile();
    const lowerLogin = login.toString().toLowerCase();
    if (usersDB.users) {
        const user = usersDB.users[lowerLogin];
        if (user) {
            const currentHash = user.passwordHash;
            if (currentHash) {
                const isMatch = await bcryptjs_1.default.compare(password, currentHash);
                if (isMatch) {
                    return { status: 'success',
                        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, login: user.login } };
                }
                ;
            }
        }
        else {
            return { status: 'wrong_password', error: 'Неверный пароль' };
        }
        return { status: 'not_found', error: 'Логин не найден' };
    }
}
async function findUserByloginOnly(login) {
    if (!login)
        return { status: 'not_found', error: 'Логин не найден' };
    const usersDB = await readUsersFile();
    const lowerLogin = login.toString().toLowerCase();
    if (usersDB.users) {
        const user = usersDB.users[lowerLogin];
        if (user) {
            const { passwordHash, ...dataForReturn } = user;
            return { status: "success", ...dataForReturn };
        }
        else
            return { status: 'not_found', error: 'Логин не найден' };
    }
    else
        return { status: 'not_found', error: 'Логин не найден' };
}
async function createUser(login, firstName, lastName, password) {
    const usersDB = await readUsersFile();
    const lowerLogin = login.toLowerCase().trim();
    usersDB.users[lowerLogin] = {
        id: (Number.parseInt(usersDB.lastId) + 1).toString(),
        login: lowerLogin,
        firstName: firstName,
        lastName: lastName,
        passwordHash: await hashPassword(password)
    };
    usersDB.lastId = usersDB.users[lowerLogin].id;
    await writeUsers(usersDB);
    const { passwordHash, ...dataForReturn } = usersDB.users[lowerLogin];
    return { ...dataForReturn };
}
async function writeUsers(usersObject) {
    try {
        const jsonString = JSON.stringify(usersObject, null, 4);
        await promises_1.default.writeFile(FILE_PATH, jsonString, 'utf-8');
        console.log('Пользователи успешно записаны!');
        return true;
    }
    catch (error) {
        console.log("Не удалось записать пользователей в файл: " + error.message);
        return false;
    }
}
//# sourceMappingURL=dbUsers.js.map