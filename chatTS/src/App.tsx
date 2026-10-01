import RouterMenu from './components/RouterMenu';
import Chat from './components/Chat';
import Authorisation from './components/Authorisation';
import { useState } from "react";
import { type UserProfile } from './types/auth';
import './App.css';

function App() {
    return (
        <div>
            <RouterMenu></RouterMenu>                    
        </div>
    )
}

export default App;