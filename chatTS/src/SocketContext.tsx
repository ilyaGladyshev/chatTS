import React, {useState, useEffect, createContext, useContext} from "react";
import {io, Socket} from 'socket.io-client';

interface ISocketContext {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<ISocketContext>({
    socket: null,
    isConnected: false
})
export const SocketProvider: React.FC<{ userId: string | undefined; children: React.ReactNode}> = ({userId, children}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        if (!userId) return;
        const socketInstance = io('http:localhost:5000', {
            query: {userId},
        });
        socketInstance.on('connect', () =>{
            setIsConnected(true);
            console.log('Сокет успешно подключен!');
        });
        socketInstance.on('disconnect', () =>{
            setIsConnected(false);
        });     
        setSocket(socketInstance);
        return () => {
            socketInstance.disconnect();
        };
    }, [userId]);

    return (
        <SocketContext.Provider value={{socket, isConnected}}>
            {children}
        </SocketContext.Provider>
    )
}
export const useSocket = () => useContext(SocketContext);  