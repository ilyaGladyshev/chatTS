import type { IUserProfile, IUserPublic } from "../types/auth";
import { useEffect, useState} from "react";
import { type IChatData} from "../types/chats"

export interface IChatProps{
    currentUser: IUserProfile;
    onSelectChat: (chat: IChatData) => void; 
    onStartCreateGroup: () => void; 
    usersList: IUserPublic[]; 
    routerChatsList: IChatData[]; 
}

const ChatList = ({currentUser, onSelectChat, 
    onStartCreateGroup, usersList, routerChatsList}: IChatProps) => {
    const VITE_API_URL = "http://159.194.233.93:5000";
    const [chatsList, setChatsList] = useState<IChatData[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let isMounted = true;
        async function fetchChats() {
            setChatsList(routerChatsList);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${VITE_API_URL}/api/chats/history_group`,{
                    'method':'GET',
                    'headers':{'Authorization': `Bearer ${token}`}
                } );
                const chatsResponse = await response.json();
                if (isMounted) {
                    setChatsList(chatsResponse);
                    setLoading(false);
                }		
            } catch (error) {
                console.error('Не удалось загрузить чаты', error);	
            }
        } 

        if (currentUser) {
            fetchChats();
        } else {
            setChatsList([]);
            setLoading(false);
        }

        return () => {
            isMounted = false; 
        };
    }, [currentUser])
    const getChatName = (chat: IChatData) => {
        if (chat.isGroup && chat.name) return chat.name;
        const companionId = chat.participants.find(id => id != currentUser.id.toString());
        const companion = usersList.find(users => users.id.toString() === companionId);
        if (companion) return companion.userName;
        else return 'Неизвестный собеседник';
    }
    
    if (loading) {
        return <div>Загрузка чатов...</div>;
    }
    
    return (
        <div>
            {
                ...chatsList
                    .filter(chat => chat.participants.includes(currentUser.id.toString()))
                    .map((chat) => (
                        <button className="button-chat"
                                key = {chat.id}
                                onClick={() => onSelectChat(chat)}>
                                    {getChatName(chat)}
                        </button>
                ))    
            }
            <button className="create-btn"
                    onClick={onStartCreateGroup}
            >Создать групповой чат</button>
        </div>
    );
}
export default ChatList;