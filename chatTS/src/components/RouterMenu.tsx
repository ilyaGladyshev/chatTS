import { useState, useEffect, useCallback } from 'react';
import Authorisation from './Authorisation';
import Chat from './Chat';
import ChatList from './ChatList';
import ContactList from './ContactList';
import Settings from './Settings';
import { type TTabType, type IChatState } from '../types/menu';
import { type IUserProfile, type IUserPublic } from '../types/auth';
import { SocketProvider } from './SocketContext';
import { ChatProvider } from './ChatContext';
import type { IChatData } from '../types/chats';
import CreateGropForm from './CreateGroupForm';

function RouterMenu(){
    const VITE_API_URL = "https://gladyshzoda.duckdns.org";
    const [theme, setTheme] = useState('light');
    const [currentTab, setCurrentTab] = useState<TTabType>('chats'); 
	const [currentUser, setCurrentUser] = useState<IUserProfile | null>(null); 
    const [chatState, setChatState] = useState<IChatState | null>(null);
    const [usersList, setUsersList] = useState<IUserPublic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);    
    const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'light'? 'dark' : 'light'));
	}

    const handleContactClick = useCallback(async (targetUser: IUserPublic) => {
        const token = localStorage.getItem('token');
        if (!currentUser) return;
        const response = await fetch(`${VITE_API_URL}/api/chats/find_chat`, {
            method: 'POST',
			headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({currentUserId: currentUser.id, targetUserId: targetUser.id})     
        });
        const data = await response.json();
        const targetUsers : (IUserPublic | undefined)[] = [];
            targetUsers.push(usersList.find((user) => user.id === targetUser.id));
       
        if (data.status === 'found'){
            setChatState({mode: 'view', chatId: data.chatId, targetUser: targetUsers, chat: null});
        } else{
            setChatState({mode: 'create_private', chatId: null, targetUser: targetUsers, chat: null});            
        }
    },[currentUser]);

    const handleCreateGroup = useCallback(() => {
        setChatState({mode: 'create_group', chatId: null, targetUser: null, chat: null});
    },[]);

    const handleChatClick = useCallback ((chat: IChatData) => {
        const targetUsers : (IUserPublic | undefined)[] = chat.participants.map((userId: string) => { 
            return usersList.find((user) => user.id === userId)
        });
        setChatState({mode: 'view', chatId: chat.id, targetUser: targetUsers, chat: chat});        
    }, [currentUser]);

    useEffect(() => {
	async function checkAutoLogin(){
			const token = localStorage.getItem('token');
			if (!token){
				setLoading(false);
				return;
			}
			try {
				const response = await fetch(`${VITE_API_URL}/api/auth/me`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
				const data = await response.json();
				if (response.ok && data.status === "success"){
					setCurrentUser(data.user);
				} else{
					localStorage.removeItem('token');
				}	
			} catch (error) {
				console.error('Ошибка авторизации', error);	
				setCurrentUser(null);           
			} finally{
				setLoading(false);
			}
		}            
        checkAutoLogin();
    }, [])
    useEffect(() =>{
        async function fetchUsers() {
            try {
                const response = await fetch(`${VITE_API_URL}/api/auth/usersName`);
                const users = await response.json();
                setUsersList(users);			
            } catch (error) {
                console.error('Не удалось загрузить пользователей', error);	
            }
        }        
        fetchUsers();
    }, [currentUser]);

    if (loading){
        return (
            <div className={theme === 'dark' ? 'dark-theme' : ''}>
                Идет загрузка пользователя, пожалуйста, подождите...
            </div>
        )
    }
    return (
        <div className={theme === 'dark' ? 'dark-theme' : ''}>
			<div>
				<button onClick={toggleTheme} className="btn-secondary">
					{theme === 'light' ? 'Темная тема' : 'Светлая тема'}
				</button>
			</div>  
            {!currentUser ? (
                <Authorisation 
                onLoginSuccess={
                    (user) => {
                        setCurrentUser(user);                   
                        try {
                            if (!user.token) return;
                            localStorage.setItem('token', user.token);                           
                        } catch (error) {
                            console.warn('Локальное хранилище переполнено! Производим очистку...');
                            localStorage.clear();
                            if (!user.token) return;
                            localStorage.setItem('token', user.token);	
					    }

                    }
                }></Authorisation>
            ) : (
                <div>
                    <SocketProvider userId = {currentUser.id}>
                        <ChatProvider>
                            <aside className='sidebar'>
                                <h3>Добро пожаловать, {currentUser.firstName}</h3>
                                <nav>
                                    <button className={currentTab === 'chats' ? 'button-active' : ''}
                                            onClick={() => setCurrentTab('chats')}>Чаты</button>
                                    <button className={currentTab === 'contacts' ? 'button-active' : ''}
                                                            onClick={() => setCurrentTab('contacts')}>Контакты</button>                      
                                    <button className={currentTab === 'settings' ? 'button-active' : ''}
                                                            onClick={() => setCurrentTab('settings')}>Настройки</button>  
                                </nav>
                            </aside>
                            <main className='menu-content'>
                                <div className='menu-content-left'>
                                    {currentTab === 'chats' && <ChatList currentUser={currentUser}
                                                                        onSelectChat={(chat) => handleChatClick(chat)}
                                                                        onStartCreateGroup={handleCreateGroup}
                                                                        usersList={usersList}
                                                                        ></ChatList>}
                                    {currentTab === 'contacts' && <ContactList currentUser={currentUser} 
                                                                            onSelectContact={(user: IUserPublic) => handleContactClick(user)}
                                                                            userList={usersList}></ContactList>}
                                    {currentTab === 'settings' && <Settings></Settings>}
                                </div>
                                <div className='menu-content-right'>
                                    {chatState?.mode === 'view' && chatState.chatId && (
                                        <Chat activeChatId={chatState.chatId}
                                            currentUser={currentUser}
                                            targetUser={chatState.targetUser}
                                            activeChat={chatState.chat}
                                            >
                                            </Chat>
                                    )}
                                    {chatState?.mode === 'create_private' && chatState.targetUser && (
                                        <Chat activeChatId={null}
                                            currentUser={currentUser}
                                            targetUser={chatState.targetUser}
                                            activeChat={chatState.chat}
                                            ></Chat>
                                    )}  
                                    {chatState?.mode === 'create_group' && (
                                        <CreateGropForm usersList={usersList}
                                                        onGroupCreated={
                                                            (newChat: IChatData)=> {
                                                                const targetUsers : (IUserPublic | undefined)[] = newChat.participants.map((userId: string) => { 
                                                                    return usersList.find((user) => user.id === userId)
                                                                });
                                                                setChatState({mode: 'view', chatId: newChat.id, targetUser: targetUsers, chat: newChat})
                                                            }
                                                        }
                                        ></CreateGropForm>)}                        
                                </div>      
                            </main>
                        </ChatProvider>
                    </SocketProvider>
                </div>
            )}                      
        </div>
    )
}

export default RouterMenu;