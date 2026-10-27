import React, {useState, useEffect, createContext, useContext, useRef} from "react";

interface ISocketContext {
    socket: WebSocket | null;
    isConnected: boolean;
    sendMessage: (event: string, data: any) => void;
}

const SocketContext = createContext<ISocketContext>({
    socket: null,
    isConnected: false,
    sendMessage: () => {},
});

export const SocketProvider: React.FC<{ userId: string | undefined; children: React.ReactNode}> =
 ({ userId, 
    children}) => {
    const VITE_API_WS = "ws://159.194.233.93:5000";
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<WebSocket | null>(null);
    const socketForUI = socketRef.current;
    useEffect(() => {
        if (!userId) {
            if (socketRef.current){
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
            }
            setIsConnected(false);
            return;
        };

        const token = localStorage.getItem('token');
        if (!token){
            console.warn("Нет токена, соединение не создаем");
            return;
        }

        if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || 
            socketRef.current.readyState === WebSocket.CONNECTING)) return;
        if (socketRef.current){
            socketRef.current.close();
            socketRef.current = null;
            setSocket(null);
        }

        const wsURL = `${VITE_API_WS}?token=${token}`;
        const wsInstance = new WebSocket(wsURL);
        wsInstance.onopen = () => {
            setIsConnected(true);
            const packet = {
                type: 'auth',
                userId: userId
            }
            wsInstance.send(JSON.stringify(packet));
            console.log('Сокет успешно подключен!');
        };
        wsInstance.onclose = () =>{
            setIsConnected(false);
            console.log('Сокет закрыт!');
        };   
        wsInstance.onerror = (error) => {
            console.error('Ошибка сокета: ', error);
        }  
        socketRef.current = wsInstance;
        return () => {
           if (socketRef.current){
                console.log('Размонтирование провайдера закрываем сокет');
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
           }
        };
    }, [userId]);

    const sendMessage = (event: string, data: any) =>{
        if (socket && socket.readyState === WebSocket.OPEN){
            const payload = JSON.stringify({event, data});
            socket.send(payload);
        } else if (socket && socket.readyState === WebSocket.CONNECTING){
            console.warn('Соединение еще устанавливается');
            /*const currOnOpen = socket.onopen;
            socket.onopen = (e) => {
                if (currOnOpen) currOnOpen.call(socket, e);
                socket.send(JSON.stringify({event, data}));
            }*/
        } else {
            console.warn('Попытка отправить сообщение через закрытый сокет');
        }
    }
    return (
        <SocketContext.Provider value={{socket: socketForUI, isConnected, sendMessage}}>
            {children}
        </SocketContext.Provider>
    )
}
export const useSocket = () => useContext(SocketContext);  