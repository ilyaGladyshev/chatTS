import React, {useState, useEffect, useRef} from 'react';
import {type UserProfile } from '../types/auth';
import '../App.css';

interface Message{
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    chatId: string;
}

interface ChatProps{
    currentUser: UserProfile;
}

const Chat = ({currentUser}: ChatProps) => {
    const [messages, setMessages]  = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const socketRef = useRef<WebSocket | null>(null);
    const recipientId = currentUser.id === 'usr_1' ? 'usr_2' : 'usr_1';

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:5000');
        socketRef.current = ws;
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

    const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;
    const packet = {
        type: 'message',
        text: inputText.trim(),
        senderId: currentUser.id,
        recipientId: recipientId,
        chatId: 'chat_general'
    }
    socketRef.current.send(JSON.stringify(packet));
    setInputText('');
}

return (
    <div className='chat-container'>
        <p>Диалог с: {currentUser.id === 'usr_1' ? 'Борис Бритва' : 'Илья Гладышев'}</p>
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