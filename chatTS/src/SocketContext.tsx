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

export const SocketProvider: React.FC<{ userId: string | undefined; children: React.ReactNode}> = ({userId, children}) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const wsRef = useRef<WebSocket | null>(null);
    useEffect(() => {
        if (!userId) return;
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || 
            wsRef.current.readyState === WebSocket.CONNECTING)) return;
        const wsURL = `ws://localhost:5000?userId=${userId}`
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
        };   
        wsInstance.onerror = (error) => {
            console.error('Ошибка сокета: ', error);
        }  
        wsRef.current = wsInstance;
        setSocket(wsInstance);
        return () => {
           if (wsRef.current){
                console.log('Размонтирование провайдера закрываем сокет');
                wsRef.current.close();
                wsRef.current = null;
           }
        };
    }, [userId]);

    const sendMessage = (event: string, data: any) =>{
        if (socket && socket.readyState === WebSocket.OPEN){
            const payload = JSON.stringify({event, data});
            socket.send(payload);
        } else if (socket && socket.readyState === WebSocket.CONNECTING){
            console.warn('Соединение еще устанавливается');
            const currOnOpen = socket.onopen;
            socket.onopen = (e) => {
                if (currOnOpen) currOnOpen.call(socket, e);
                socket.send(JSON.stringify({event, data}));
            }
        } else {
            console.warn('Попытка отправить сообщение через закрытый сокет');
        }
    }
    return (
        <SocketContext.Provider value={{socket, isConnected, sendMessage}}>
            {children}
        </SocketContext.Provider>
    )
}
export const useSocket = () => useContext(SocketContext);  