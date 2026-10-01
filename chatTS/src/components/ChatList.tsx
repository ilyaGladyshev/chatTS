import type { IUserProfile } from "../types/auth";
import {useState, useEffect} from "react";

export interface IChatProps{
    currentUser: IUserProfile;
    onSelectChatId: (chatId: string) => void;    
}

const ChatList = ({currentUser, onSelectChatId}: IChatProps) => {
    const [chatsList, setChatsList] = useState<string[]>([]);
    useEffect(() => {
        async function fetchChats() {
            try {
                const response = await fetch('/api/chats/history_group');
                const chatsResponse = await response.json();
                setChatsList(chatsResponse);			
            } catch (error) {
                console.error('Не удалось загрузить чаты', error);	
            }
        }            
        fetchChats();
    })
    return (
        <div>
            {
                ...chatsList.map((currentValue) => (
               <button className="button-chat"
                    onClick={() => onSelectChatId(currentValue)}>
                        {currentValue}
                </button>
                ))    
            }
        </div>
    );
}
export default ChatList;