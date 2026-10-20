import { useState, useEffect } from 'react';
import Authorisation from './Authorisation';
import Chat from './Chat';
import ChatList from './ChatList';
import ContactList from './ContactList';
import Settings from './Settings';
import { type TTabType, type IChatState } from '../types/menu';
import { type IUserProfile, type IUserPublic } from '../types/auth';
import { SocketProvider } from '../SocketContext';
import type { IChatData } from '../types/chats';
import CreateGropForm from './CreateGroupForm';

function RouterMenu(){
    const [theme, setTheme] = useState('light');
    const [currentTab, setCurrentTab] = useState<TTabType>('chats'); 
	const [currentUser, setCurrentUser] = useState<IUserProfile | null>(null);
    const [activeChatId] = useState<string|null>(null); 
    const [chatState, setChatState] = useState<IChatState | null>(null);
    const [chatsList, setChatsList] = useState<IChatData[]>([]);
    const [usersList, setUsersList] = useState<IUserPublic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);    
    const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'light'? 'dark' : 'light'));
	}

    const handleContactClick = async (targetUser: IUserPublic) => {
        const token = localStorage.getItem('token');
        if (!currentUser) return;
        const response = await fetch('/api/chats/find_chat', {
            method: 'POST',
			headers: {
                'Content-Type': 'application',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({currentUserId: currentUser.id, targetUserId: targetUser.id})     
        });
        const data = await response.json();
        const targetUserArray = [targetUser];
        if (data.status === 'found'){
            setChatState({mode: 'view', chatId: data.chatId, targetUser: targetUserArray, chat: null});
        } else{
            setChatState({mode: 'create_private', chatId: null, targetUser: targetUserArray, chat: null});            
        }
    }
    const handleCreateGroup = () => {
        setChatState({mode: 'create_group', chatId: null, targetUser: null, chat: null});
    }

    const handleChatClick = async (chat: IChatData) => {
        const filteredParticipants = chat.participants.filter(userId => {return userId != currentUser?.id});
        const targetUsers : (IUserPublic | undefined)[] = filteredParticipants.map((userId: string) => { 
            return usersList.find((user) => user.id === userId)
        });
        setChatState({mode: 'view', chatId: chat.id, targetUser: targetUsers, chat: chat});        
    }

    const handleUpdateLastMesage = (chatId: string | null, incommingMessage: any) => {
        setChatsList((prevChats) => 
            prevChats.map((chat) => 
                chat.id === chatId
                ? {...chat, lastMessage: incommingMessage}
                : chat
            )
        );
    }

    useEffect(() =>{
        async function fetchUsers() {
            try {
                const response = await fetch('/api/auth/usersName');
                const users = await response.json();
                setUsersList(users);			
            } catch (error) {
                console.error('Не удалось загрузить пользователей', error);	
            }
        }        
        async function fetchChats() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/chats/history_group',{
                    'method':'GET',
                    'headers':{'Authorization': `Bearer ${token}`}
                } );
                const chatsResponse = await response.json();
                setChatsList(chatsResponse);			
            } catch (error) {
                console.error('Не удалось загрузить чаты', error);	
            }
        }    
		async function checkAutoLogin(){
			const token = localStorage.getItem('token');
			if (!token){
				setLoading(false);
				return;
			}
			try {
				const response = await fetch('/api/auth/me', {
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
        fetchChats();
        fetchUsers();
        checkAutoLogin();
    }, []);
    if (loading){
        return (
            <div>
                Идет загрузка пользлвателя, пожалуйста, подождите...
            </div>
        )
    }
    return (
        <div>
			<div>
				<button onClick={toggleTheme} className="btn-secondary">
					{theme === 'light' ? 'Темная тема' : 'Светлая тема'}
				</button>
			</div>  
            {!currentUser ? (
                <Authorisation 
                onLoginSuccess={
                    (currentUser) => {
                        setCurrentUser(currentUser);
                        try {
                            if (!currentUser.token) return;
                            localStorage.setItem('token', currentUser.token);                           
                        } catch (error) {
                            console.warn('Локальное хранилище переполнено! Производим очистку...');
                            localStorage.clear();
                            if (!currentUser.token) return;
                            localStorage.setItem('token', currentUser.token);	
					    }

                    }
                }></Authorisation>
            ) : (
                <div>
                    <SocketProvider userId = {currentUser.id}>
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
                                                                    chatsList={chatsList}></ChatList>}
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
                                          onNewMessageReceived={(msg) => handleUpdateLastMesage(activeChatId, msg)}>
                                          </Chat>
                                )}
                                {chatState?.mode === 'create_private' && chatState.targetUser && (
                                    <Chat activeChatId={null}
                                          currentUser={currentUser}
                                          targetUser={chatState.targetUser}
                                          activeChat={chatState.chat}
                                          onNewMessageReceived={(msg) => handleUpdateLastMesage(activeChatId, msg)}></Chat>
                                )}  
                                {chatState?.mode === 'create_group' && (
                                    <CreateGropForm usersList={usersList}
                                                    onGroupCreated={(newChatId: string)=>setChatState({mode: 'create_group', chatId: newChatId, targetUser: null, chat: null})}
                                    ></CreateGropForm>)}                        
                            </div>      
                        </main>
                    </SocketProvider>
                </div>
            )}                      
        </div>
    )
}

export default RouterMenu;