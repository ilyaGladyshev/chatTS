import type { IUserProfile, IUserPublic } from "../types/auth";
import {useState, useEffect} from "react";
import { type IChatData} from "../types/chats"

export interface IChatProps{
    currentUser: IUserProfile;
    onSelectChat: (chat: IChatData) => void;  
    chatsList: IChatData[];
    usersList: IUserPublic[];  
}

const ChatList = ({currentUser, onSelectChat, chatsList, usersList}: IChatProps) => {
    useEffect(() => {
    }, [])
    const getChatName = (chat: IChatData) => {
        if (chat.isGroup && chat.name) return chat.name;
        const companionId = chat.participaints.find(id => id != currentUser.id);
        const companion = usersList.find(users => users.id === companionId);
        if (companion) return companion.userName;
        else return 'Неизвестный собеседник';
    }
    return (
        <div>
            {
                ...chatsList.map((chat) => (
               <button className="button-chat"
                    key = {chat.id}
                    onClick={() => onSelectChat(chat)}>
                        {getChatName(chat)}
                </button>
                ))    
            }
        </div>
    );
}
export default ChatList;