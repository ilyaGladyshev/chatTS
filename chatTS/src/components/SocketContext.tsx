import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import type { IChatData } from "../types/chats";

type TEventType = 'new_message' | 'chat_created' | 'typing' | 'user_status';

interface IEventPayloadMap {
  new_message: { chatId: string | null, incommingMessage: any };
  chat_created: { chat: IChatData }; 
  typing: { chatId: string; userId: string; isTyping: boolean };
  user_status: { userId: string; status: 'online' | 'offline' };
}

interface ISocketContext {
    socket: WebSocket | null;
    isConnected: boolean;
    sendMessage: (event: string, data: any) => void;
    on: <T extends TEventType>(type: T, handler: (data: IEventPayloadMap[T]) => void) => void;
    off: <T extends TEventType>(type: T, handler: (data: IEventPayloadMap[T]) => void) => void;    
}

const SocketContext = createContext<ISocketContext>({
    socket: null,
    isConnected: false,
    sendMessage: () => {},
    on: () => {},
    off: () => {}
});

export const SocketProvider: React.FC<{ userId: string | undefined; children: React.ReactNode}> =
 ({ userId, children }) => {
    const VITE_API_WS = "wss://gladyshzoda.duckdns.org";
    
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [socketInstance, setSocketInstance] = useState<WebSocket | null>(null);
    
    const socketRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<Map<TEventType, ((data: any) => void)[]>>(new Map());

    useEffect(() => {
        if (!userId) {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            setIsConnected(false);
            setSocketInstance(null);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        // Если уже есть активное соединение для этого юзера - не создаем новое
        if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) return;
        
        if (socketRef.current) {
            socketRef.current.close();               
            socketRef.current = null;
        }

        const wsURL = `${VITE_API_WS}?token=${token}`;
        const ws = new WebSocket(wsURL);

        ws.onopen = () => {
            console.log('Сокет успешно подключен!');
            setIsConnected(true);
            // ВАЖНО: Сохраняем в стейт, чтобы вызвать ре-рендер у детей
            setSocketInstance(ws); 
            
            const packet = { type: 'auth', userId };
            ws.send(JSON.stringify(packet));
        };

        ws.onclose = () => {
            console.log('Сокет закрыт!');
            setIsConnected(false);
            setSocketInstance(null); // Сбрасываем стейт
        };   

        ws.onerror = (error) => {
            console.error('Ошибка сокета: ', error);
        };  

        socketRef.current = ws;

        return () => {
           if (socketRef.current){
                try {
                    socketRef.current.close();               
                } catch (e) { console.log(e); }
                socketRef.current = null;
           }
        };
    }, [userId]); // <--- Зависимость только от userId

    useEffect(() => {
        const ws = socketRef.current;
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            let data: any;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                console.warn('Невалидный JSON от сервера', event.data);
                return;
            }

            const type = data.event || data.type as TEventType;
            if (!type) {
                console.warn('Получено сообщение без типа события', data);
                return;
            }

            const handlers = listenersRef.current.get(type) || [];
            handlers.forEach((h) => h(data.data || data)); 
        };

        ws.onmessage = handleMessage;

        // Очистка onmessage при пропадании сокета (чтобы не вызвать ошибку на закрытом)
        return () => {
            ws.onmessage = null;
        };
    }, [socketRef.current]); // <--- Ключевая зависимость! Реагирует на появление сокета

    const sendMessage = (event: string, data: any) => {
        // Используем стейт для проверки готовности
        if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({ event, data });
            socketInstance.send(payload);
        } else if (socketInstance && socketInstance.readyState === WebSocket.CONNECTING) {
            console.warn('Соединение еще устанавливается');
        } else {
            console.warn('Попытка отправить сообщение через закрытый сокет');
        }
    };

    const on = <T extends TEventType>(type: T, handler: (data: IEventPayloadMap[T]) => void) => {
        if (!listenersRef.current.has(type)) {
            listenersRef.current.set(type, []);
        }
        listenersRef.current.get(type)!.push(handler);
    };

    const off = <T extends TEventType>(type: T, handler: (data: IEventPayloadMap[T]) => void) => {
        const list = listenersRef.current.get(type);
        if (list) {
            const index = list.indexOf(handler);
            if (index > -1) list.splice(index, 1);
        }
    };

    return (
        <SocketContext.Provider value={{
            socket: socketInstance, 
            isConnected, 
            sendMessage,
            on,
            off
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);