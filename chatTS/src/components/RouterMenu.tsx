import { useState } from 'react';
import { Route, Router, Routes } from 'react-router-dom';
import Authorisation from './Authorisation';
import Chat from './Chat';
import ChatList from './ChatList';
import ContactList from './ContactList';
import Settings from './Settings';
import { type TTabType, type IChatState } from '../types/menu';
import { type IUserProfile, type IUserPublic } from '../types/auth';
import { SocketProvider } from '../SocketContext';

function RouterMenu(){
    const [theme, setTheme] = useState('light');
    const [currentTab, setCurrentTab] = useState<TTabType>('chats'); 
	const [currentUser, setCurrentUser] = useState<IUserProfile | null>(null);
    const [activeChatId, setActiveChatId] = useState<string|null>(null); 
    const [chatState, setChatState] = useState<IChatState | null>(null);
    const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'light'? 'dark' : 'light'));
	}

    const handleContactClick = async (targetUser: IUserPublic) => {
        if (!currentUser) return;
        const response = await fetch('/api/chats/find_chat', {
            method: 'POST',
            headers: {'Content-Type': 'application'}, 
            body: JSON.stringify({currentUserId: currentUser.id, targetUserId: targetUser.id})     
        });
        const data = await response.json();
        if (data.status === 'found'){
            setChatState({mode: 'view', chatId: data.chatId, targetUser: null});
        } else{
            setChatState({mode: 'create', chatId: null, targetUser});            
        }
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
                                                                    onSelectChatId={(id) => setActiveChatId(id)}></ChatList>}
                                {currentTab === 'contacts' && <ContactList currentUser={currentUser} 
                                                                        onSelectContact={(user: IUserPublic) => handleContactClick(user)}></ContactList>}
                                {currentTab === 'settings' && <Settings></Settings>}
                            </div>
                            <div className='menu-content-right'>
                                {chatState?.mode === 'view' && chatState.chatId && (
                                    <Chat activeChatId={chatState.chatId}
                                          currentUser={currentUser}
                                          targetUser={null}
                                          >
                                          </Chat>
                                )}
                                {chatState?.mode === 'create' && chatState.targetUser && (
                                    <Chat activeChatId={null}
                                          currentUser={currentUser}
                                          targetUser={chatState.targetUser}></Chat>
                                )}                          
                            </div>      
                        </main>
                    </SocketProvider>
                </div>
            )}                      
        </div>
    )
}

export default RouterMenu;