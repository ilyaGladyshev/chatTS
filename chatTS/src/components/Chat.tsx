import React, {useState, useEffect, useRef} from 'react';
import {type IUserProfile, type IUserPublic} from '../types/auth';
import { type IMessage} from '../types/message';
import { useSocket } from '../SocketContext';
import '../App.css';

interface IChatProps{
    currentUser: IUserProfile;
    activeChatId: string | null;
    targetUser: (IUserPublic | undefined)[] | null;
    onNewMessageReceived: (msg: any) => void;
}

const Chat = ({currentUser, activeChatId, targetUser, onNewMessageReceived}: IChatProps) => {
    const [messages, setMessages]  = useState<IMessage[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const {socket} = useSocket();
    const socketRef = useRef<WebSocket | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string|null>(null);
    const [chatName, setChatName] = useState<string>('')

    useEffect(() => {
        const loadMessages = async () => {
            if (activeChatId){
                const response = await fetch(`/api/messages/history?chatId=${activeChatId}`);
                if (!response.ok){
                    throw new Error('Не удалось загрузить историю сообщений!');
                }
                const responseMessages: IMessage[] = await response.json();
                setMessages(responseMessages);
            }
        }
        loadMessages();
        if ((targetUser?.length === 1) && (targetUser[0])){
            setChatName(targetUser[0]?.userName);
        }
        if (!socket) return;
        socketRef.current = socket;
        setCurrentChatId(activeChatId);
        socket.onopen = () => {
            console.log("Туннель открыт! Отправляем паспорт...");
            socket.send(JSON.stringify({
                type: 'auth',
                userId: currentUser.id
            }));
        }
        socket.onmessage = (event) => {
            const packet = JSON.parse(event.data);
            if (packet.type === 'new_message'){
                const newMessage = packet.data;
                setMessages((prev) => [...prev, newMessage]);
                onNewMessageReceived(newMessage);
            }
            return () => {
                socket.close();
            };
        }
        const handleReceiveMessage = (e: MessageEvent) => {
            const parsedData = JSON.parse(e.data);
            if (parsedData.event === "new_message" && parsedData.data.chatId === activeChatId){
                setMessages((prev) => [...prev, parsedData.data]);
            }
        }
        socket.addEventListener('message', handleReceiveMessage);
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (!socketRef) return;
    const currentSocket = socketRef.current;
    if (!currentSocket) return;
    if ((!socket) || (!inputText.trim())) return;
    let NewChatId: string|null = currentChatId; 
    if (currentChatId === null){
        try {
            const participaints: (string | undefined) [] = [currentUser.id, targetUser.values.name];
            const response = await fetch('/api/chats/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({participaints: participaints})
            }); 
            NewChatId = await response.json();
            setCurrentChatId(NewChatId);           
        } catch (error) {
            console.log("Не удалось создать новый чат!");    
        }
    }
    if (!inputText.trim() || !socketRef.current) return;
    targetUser.map((target: (IUserPublic | undefined)) => {
        if (!target) return;
        const packet = {
            type: 'message',
            text: inputText.trim(),
            senderId: currentUser.id,
            recipientId: target.id,
            chatId: NewChatId
        }
        currentSocket.send(JSON.stringify(packet));
    });
    setInputText('');
}

return (
    <div className='chat-container'>
        <p>Диалог с: {chatName}</p>
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