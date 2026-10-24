# 💬 ChatTS (ilyaGladyshev/chatTS)

Fullstack-приложение для обмена сообщениями в реальном времени, написанное на **TypeScript** и React. Поддерживает личные и групповые чаты.

Учебный full-stack проект: авторизация, WebSocket-обмен сообщениями, хранение данных в MySQL.

---

## ✨ Ключевые особенности и архитектура

## Возможности

* Регистрация и вход (пароли через bcrypt, сессии через JWT) 
* Личные чаты (1-на-1)
* Групповые чаты 
* История сообщений 
* Список пользователей для начала диалога 
* Защита API и WebSocket-подключений токеном 
* **Автоматический скролл:** Интеллектуальное управление UX на клиенте — автоматическая плавная прокрутка к новым сообщениям с помощью React `useRef` и метода `scrollIntoView`.
* **Кастомная темная тема:** Интерфейс поддерживает светлый и темный режимы, реализованные на чистом **CSS (Custom Properties)** с сохранением выбора пользователя в `localStorage`.
* **Строгая типизация:** Полное покрытие кода интерфейсами TypeScript как на фронтенде, так и на бэкенде. Чистое разделение сущностей базы данных (`RowDataPacket`) и бизнес-логики приложения.
* Оптимистичный UI
---

![Чат](/assets/Chat.jpg)
![Темная тема](/assets/GroupChatCreate.jpg)

## 🛠️ Стек технологий

| Слой | Технологии |
|------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, TypeScript, нативный `http`, `ws` |
| БД | MySQL (`mysql2`, connection pool) |
| Безопасность | bcryptjs, JWT (HS256), `dotenv` |

## Структура проекта

```text
chatTS/
├── chatTS/                 # фронтенд (Vite + React)
└── chatTS-backend/         # бэкенд
    ├── src/
    │   ├── server_mysql.ts # основная точка входа
    │   ├── db.ts           # пул соединений MySQL
    │   ├── dbUsersMySQL.ts
    │   ├── dbChatsMySQL.ts
    │   ├── dbMessagesMySQL.ts
    │   └── jwt.ts
    └── .env                # не коммитится
```
Рабочий сервер — server_mysql.ts. Старые JSON-модули (server.ts, dbUsers.ts и т.п.) можно не использовать.
---

## 🚀 Как запустить проект локально

### 1. Требования
Убедитесь, что у вас установлены:
*   [Node.js](https://nodejs.org) (версии 16+)
*   [MySQL Server](https://mysql.com)

### 2. Клонирование репозитория
```bash
git clone https://github.com/ilyaGladyshev/chatTS.git
cd chatTS
```

### 3. Настройка базы данных
Создайте базу данных в MySQL:
```sql
CREATE DATABASE chat_ts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chat_ts;
```
Примените схему (создание таблиц):
```bash
mysql -u root -p chat_ts < chatTS-backend/db/schema.sql
```
(Опционально) Заполните тестовыми данными:
```bash
mysql -u root -p chat_ts < chatTS-backend/db/seed.sql
```
Файл seed.sql содержит готовые чаты, пользователей и сообщения — удобно для быстрой проверки.

### 4. Настройка окружения
В папке chatTS-backend создайте файл .env (если его нет) и добавьте:
```env
JWT_SECRET=ваш_секретный_ключ_здесь
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ваш_пароль_от_mysql
DB_NAME=chat_ts
```
⚠️ Файл .env добавлен в .gitignore и не должен попадать в публичный репозиторий.

### 5. Установка зависимостей и запуск

**Запуск бэкенда:**
```bash
cd chatTS-backend
# Перейдите в директорию сервера (если они разделены, либо запустите из корня)
npm install
npm start
```
Сервер: http://localhost:5000

**Запуск фронтенда:**
```bash
cd chatTS
# Перейдите в директорию клиента
npm install
npm run dev
```
Адрес: http://localhost:3000
---

API (кратко)

| Метод | Путь | Описание |
| :--- | :--- | :--- |
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход, выдаёт JWT |
| GET | /api/auth/me | Текущий пользователь |
| GET | /api/chats/history_group | Список чатов |
| POST | /api/chats/create | Создать чат |
| GET | /api/messages/history | История сообщений |

WebSocket: подключение с токеном, например
ws://localhost:5000?token=<JWT>
---

Автор
Илья Гладышев
GitHub: ilyaGladyshev