import React, {useState} from 'react';
import { type AuthResponse, type UserProfile } from '../types/auth';

interface AuthorisationProps {
    onLoginSuccess: (user: UserProfile) => void;
}

export default function Authorisation({onLoginSuccess} : AuthorisationProps) {
    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>(''); 
    const [loading, setLoading] = useState<boolean>(false);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({login: login.trim(), password})
            });
            const data: AuthResponse = await response.json();
            if (response.ok && data.status === 'success' && data.user){
                onLoginSuccess(data.user);
            } else {
                setError(data.error || 'Ошибка авторизации');
            }   
        } catch (error) {
            setError('Сервер чата недоступен');    
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='authorisation-container'>
            <h2>Вход в Мессенджер</h2>   
            {error && <div className='error'>{error}</div>} 
            <form onSubmit={handleLogin}>
                <input
                    name='login'
                    type="text"
                    placeholder="Ваш логин"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                />
                <input
                    name='password'
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Вход в сеть...' : 'Войти в чат'}
                </button>
            </form>
        </div>
    )
}
