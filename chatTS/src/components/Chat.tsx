import React, {useState, useEffect, useRef} from 'react';
import {type IUserProfile, type IUserPublic} from '../types/auth';
import { type IMessage} from '../types/message';
import { useSocket } from '../SocketContext';
import '../App.css';
import { type IChatData } from '../types/chats';

interface IChatProps{
    currentUser: IUserProfile;
    activeChatId: string | null;
    targetUser: (IUserPublic | undefined)[] | null;
    onNewMessageReceived: (msg: any) => void;
    activeChat: IChatData | undefined | null;
}
const Chat = ({currentUser, activeChatId, targetUser, onNewMessageReceived, activeChat}: IChatProps) => {
    const VITE_API_URL = "https://gladyshzoda.duckdns.org";
    const [messages, setMessages]  = useState<IMessage[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const {socket} = useSocket();
    const socketRef = useRef<WebSocket | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string|null>(null);
    const [chatName, setChatName] = useState<string>('')
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (!messagesEndRef.current) return;
        messagesEndRef.current.scrollIntoView({behavior: 'smooth'});
    }
    useEffect(() => {
        const loadMessages = async () => {
            const token = localStorage.getItem('token');
            if (!activeChatId) return;
            const response = await fetch(`${VITE_API_URL}/api/messages/history?chatId=${activeChatId}`,{
                'method': 'GET',
                'headers':{
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok){
                throw new Error('Не удалось загрузить историю сообщений!');
            }
            const responseMessages: IMessage[] = await response.json();
            responseMessages.map(m => m.status = 'delivered');
            setMessages(responseMessages);          
        };

        loadMessages();
        if ((targetUser?.length === 1) && (targetUser[0])){
            setChatName(targetUser[0]?.userName);
        } else{
            if (!activeChat) return;
            if (!activeChat.name) return;
            setChatName(activeChat.name);
        }
    },[activeChatId, activeChat, targetUser]);

    useEffect(() => {
        try {
            if (!socket || !currentUser.id) return;
            socketRef.current = socket;
            setCurrentChatId(activeChatId);
            const handleReceiveMessage = (e: MessageEvent) => {
                let data: any;
                try {
                    data = JSON.parse(e.data);                    
                } catch (error) {
                    return;    
                }
                if (data.type != "new_message") return;
                const incomingMsg = data.data as IMessage;
                if (data.data.chatId != activeChatId) return;   
                setMessages((prev) => {
                    const updated = [...prev];
                    const pendingIndex = updated.findIndex(m => m.status === 'pending' && m.senderId === incomingMsg.senderId && m.text === incomingMsg.text);
                    if (pendingIndex !== -1) {
                        updated[pendingIndex] = {
                        ...updated[pendingIndex],
                        id: incomingMsg.id,
                        status: 'delivered',
                        };
                    } else {
                        if (!updated.some(m => m.id === incomingMsg.id)) {
                        updated.push(incomingMsg);
                        }
                    }
                    return updated;
                });                 
                onNewMessageReceived(data);
                scrollToBottom();            
            }
            socket.addEventListener('message', handleReceiveMessage);
            return () => {
                socket.removeEventListener('message', handleReceiveMessage);
            };            
        } catch (error) {
            
        }

    }, [socket, activeChatId, currentUser.id, onNewMessageReceived]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const tempId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const token = localStorage.getItem('token');
        if (!targetUser) return;
        if (!socketRef) return;
        const currentSocket = socketRef.current;
        if (!currentSocket) return;
        if ((!socket) || (!inputText.trim())) return;
        let newChatId = currentChatId;
        if (!newChatId){
            try {
                const participants: (string | undefined) [] = [currentUser.id, targetUser[0]?.id];
                const response = await fetch(`${VITE_API_URL}/api/chats/create`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({name: '', isGroup: false, participants: participants})
                }); 
                const newChat = await response.json();
                newChatId = newChat.id;
                setCurrentChatId(newChatId);           
            } catch (error) {
                console.log("Не удалось создать новый чат!");    
            }
        }
        if (!inputText.trim() || !socketRef.current) return;
        if (!newChatId) return;
        const newPendingMessage: IMessage = {
            id: tempId,
            senderId: currentUser.id,
            text: inputText.trim(),
            timestamp: Date.now(),
            chatId: newChatId,
            status: 'pending'
        };
        setMessages((prev) => [...prev, newPendingMessage]);        
        const packet = {
            type: 'message',
            text: inputText.trim(),
            senderId: currentUser.id,
            chatId: newChatId
        }
        currentSocket.send(JSON.stringify(packet));
        setInputText('');
    }   

return (
    <div className='chat-container'>
        <p>Диалог с: {chatName}</p>
        <div className='chat-window'>
            {messages.map((msg: IMessage) => {
                const isMyMessage = msg.senderId === currentUser.id;
                const status = msg.status;
                return (
                    isMyMessage ? <div key={msg.id} className={status === 'pending' ? 'chat-item_right_pending':  'chat-item_right_delivered'}>
                        <span className={'chat-textbox-my'}>{msg.text}</span>
                    </div> 
                    : <div key={msg.id} className={'chat-item_left'}>
                        <span className={'chat-textbox-other'}>{msg.text}</span>
                    </div> 
                )
            })}
            <div ref={messagesEndRef} ></div>
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