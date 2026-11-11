FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
RUN npm install

# Копируем весь исходный код проекта (включая tsconfig.json, src и т.д.)
COPY . .

# Компилируем TypeScript в JavaScript (создает папку dist/)
RUN npm run build

# Открываем внутренний порт приложения
EXPOSE 5000

# ВАЖНО: Запускаем скомпилированный файл из папки dist
CMD ["node", "dist/server_mysql.js"]