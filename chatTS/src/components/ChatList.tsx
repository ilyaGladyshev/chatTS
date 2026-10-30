import type { IUserProfile, IUserPublic } from "../types/auth";
import { useEffect, useState} from "react";
import { type IChatData} from "../types/chats"
import { useChats } from './ChatContext';

export interface IChatProps{
    currentUser: IUserProfile;
    onSelectChat: (chat: IChatData) => void; 
    onStartCreateGroup: () => void; 
    usersList: IUserPublic[]; 
}

const ChatList = ({currentUser, onSelectChat, 
    onStartCreateGroup, usersList}: IChatProps) => {
    const [chatsList, setChatsList] = useState<IChatData[]>([]);
    const [loading, setLoading] = useState(true);
    const { chatList, isLoading} = useChats();    
    useEffect(() => {
        let isMounted = true;
        setChatsList(chatList);
        setLoading(isLoading);
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