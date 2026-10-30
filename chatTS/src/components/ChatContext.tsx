
import type { IChatData } from '../types/chats';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSocket } from './SocketContext';

interface ChatContextType {
  chatList: IChatData[];
  isLoading: boolean;

}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode}> = ({ children }: { children: ReactNode }) => {
  const [chatList, setChatList] = useState<IChatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {socket, on, off} = useSocket();  
  const VITE_API_URL = "https://gladyshzoda.duckdns.org";
  useEffect(() => {
    const fetchChats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${VITE_API_URL}/api/chats/history_group`,{
                'method':'GET',
                'headers':{'Authorization': `Bearer ${token}`}
            } );
            const chatsResponse = await response.json();
            setChatList(chatsResponse);			
        } catch (error) {
            console.error('Не удалось загрузить чаты', error);	
        } finally {

            setIsLoading(false);
        }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdateLastMesage = (data:{chatId: string | null, incommingMessage: any}) => {
        setChatList((prevChats) => 
            prevChats.map((chat) => 
                chat.id === data.chatId
                ? {...chat, lastMessage: data.incommingMessage}
                : chat
            )
        );
    }

    const handleChatCreated = (data: { chat: IChatData }) => {
      if (!chatList.some((c) => c.id === data.chat.id)) {
        setChatList((prev) => [...prev, data.chat]);
      }
    };

    on('new_message', handleUpdateLastMesage);
    on('chat_created', handleChatCreated);

    return () => {
      off('new_message', handleUpdateLastMesage);
      off('chat_created', handleChatCreated);
    };
  }, [socket, on, off]); 

  return (
    <ChatContext.Provider value={{ chatList, isLoading }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChats must be used within ChatProvider');
  return context;
};