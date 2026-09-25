import RouterMenu from './components/RouterMenu';
import Chat from './components/Chat';
import Authorisation from './components/Authorisation';
import { useState } from "react";
import { type UserProfile } from './types/auth';
import './App.css';

function App() {
    const [theme, setTheme] = useState('light'); 
	const [currentUser, setCurrentUser] = useState<UserProfile>();    
    const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'light'? 'dark' : 'light'));
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
                    <p>Добро пожаловать, {currentUser.firstName}</p>
					<Chat currentUser={currentUser}></Chat>
                </div>
            )}                      
        </div>
    )
}

export default App;