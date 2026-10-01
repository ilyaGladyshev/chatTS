import React, {useState, useEffect, useRef} from 'react';
import {type IUserProfile, type IUserPublic } from '../types/auth';
import { type IMessage } from '../types/message';
import '../App.css';
import type { IChatData } from '../types/chats';

interface IChatProps{
    currentUser: IUserProfile;
    activeChatId: string | null;
    targetUser: IUserPublic | null;
}

const Chat = ({currentUser, activeChatId, targetUser}: IChatProps) => {
    const [messages, setMessages]  = useState<IMessage[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const socketRef = useRef<WebSocket | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string|null>(null);
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:5000');
        socketRef.current = ws;
        setCurrentChatId(activeChatId);
        ws.onopen = () => {
            console.log("Туннель открыт! Отправляем паспорт...");
            ws.send(JSON.stringify({
                type: 'auth',
                userId: currentUser.id
            }));
        }
        ws.onmessage = (event) => {
            const packet = JSON.parse(event.data);
            if (packet.type === 'new_message'){
                setMessages((prev) => [...prev, packet.data]);
            }
            return () => {
                ws.close();
            };
        }
    }, [currentUser.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentChatId === null){
        try {
            const participaints: (string | undefined) [] = [currentUser.id, targetUser?.id];
            const response = await fetch('/api/chats/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({participaints: participaints})
            }); 
            const newChat: IChatData = await response.json();
            setCurrentChatId(newChat.id);           
        } catch (error) {
            console.log("Не удалось создать новый чат!");    
        }
    }
    if (!inputText.trim() || !socketRef.current) return;
    const packet = {
        type: 'message',
        text: inputText.trim(),
        senderId: currentUser.id,
        recipientId: targetUser?.id,
        chatId: currentChatId
    }
    socketRef.current.send(JSON.stringify(packet));
    setInputText('');
}

return (
    <div className='chat-container'>
        <p>Диалог с: {targetUser?.userName}</p>
        <div className='chat-window'>
            {messages.map((msg) => {
                const isMyMessage = msg.senderId === currentUser.id;
                return (
                    <div key={msg.id} className={isMyMessage ? 'chat-item_right':  'chat-item_left'}>
                        <span className={isMyMessage ? 'chat-textbox-my':  'chat-textbox-other'}>{msg.text}</span>
                    </div>
                )
            })}
        </div>
        <form onSubmit={handleSendMessage}>
            <input
                type='text'
                name="message"
                placeholder='Напишите сообщение...'
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />
            <button type='submit'>
                Отправить сообщение
            </button>
        </form>
    </div>
)
}

export default Chat;