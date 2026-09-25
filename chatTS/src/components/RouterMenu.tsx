import React, { useEffect } from 'react';
import { Route, Router, Routes } from 'react-router-dom';
import MainMenu from './MainMenu';
import Chat from './Chat';
import { type UserProfile } from '../types/auth';

interface RouterMenuProps{
    currentUser: UserProfile;
}
const RouterMenu = ({currentUser}:RouterMenuProps) => {   
    return (
        <div>
            <Routes>
                <Route path="/" element={<MainMenu/>}></Route>
                <Route path="/" element={<Chat currentUser={currentUser}/>}></Route>                
            </Routes>
        </div>
    )
}

export default RouterMenu;