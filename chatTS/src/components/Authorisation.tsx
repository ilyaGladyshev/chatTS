import React, {useState, useEffect} from 'react';
import { EAuthStage, type IAuthResponse, type IUserProfile } from '../types/auth';

interface AuthorisationProps {
    onLoginSuccess: (user: IUserProfile) => void;
}

export default function Authorisation({onLoginSuccess} : AuthorisationProps) {
    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>(''); 
    const [loading, setLoading] = useState<boolean>(false);
	const [selectedLogin, setSelectedLogin] = useState<string>('');
	const [userList, setUserList] = useState<string[]>([]);
    const [stage, setStage] = useState<EAuthStage>(EAuthStage.Auth)
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');  
     
	useEffect(() =>{
		async function fetchUsers() {
			try {
				setSelectedLogin('new_account');
				const response = await fetch('/api/auth/users');
				const logins = await response.json();
				setUserList(logins);			
			} catch (error) {
				console.error('Не удалось загрузить пользователей', error);	
			}
		}
		fetchUsers();
	}, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedLogin != 'new_account'){
            setError('');
            setLoading(true);       
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({login: selectedLogin.trim(), password})
                });
                const data: IAuthResponse = await response.json();
                if (response.ok && data.status === 'success' && data.user){
                    onLoginSuccess(data.user);
                } else {
                    setError(data.error || 'Ошибка авторизации');
                } 
                setStage(EAuthStage.Succes);  
            } catch (error) {
                setError('Сервер чата недоступен');    
            } finally {
                setLoading(false);
            }
        } else{
            setStage(EAuthStage.EnterNewuser);
        }

    }

	const writeNewUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (login.trim() === ""){
			console.log("Введите логин!");
		} else if (firstName.trim() === ""){
			console.log("Введите имя!");
		} else if (lastName.trim() === ""){
			console.log("Введите фамилию!");	
		} else if (password === ""){
			console.log("Введите пароль!");			
		}else{
			setLoading(true);
			try {
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: {'Content-Type': '/application/json'},
					body: JSON.stringify({
						login: login.trim(),
						firstName: firstName.trim(),
						lastName: lastName.trim(),
						password: password.trim()
					})
				});
				const data = await response.json();
				if (response.ok && data.success){
					alert('Регистрация успешна!');
					onLoginSuccess(data.user);
				}	
			} catch (error) {
				console.error("Ошибка сети", error);	
			} finally{
				setLoading(false);
			}
		}
	}

    return (
        <div className='authorisation-container'>
            <h2>Вход в Мессенджер</h2>   
            {error && <div className='error'>{error}</div>} 
            {stage === EAuthStage.Auth && (
            <form onSubmit={handleLogin}>
                <select
                    name='login'
                    value={selectedLogin}
                    onChange={(e) => setSelectedLogin(e.target.value)}>
                    {...userList.map((currentValue, index) => (
                        <option key={index} value={currentValue}>
                            {currentValue}
                        </option>
                    ))}                        
                    <option value="new_account">Создать новый аккаунт...</option>
                </select>
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
            )}
            {stage === EAuthStage.EnterNewuser && (
				<form className="autorization-form" onSubmit = {writeNewUser} 
				 onReset = {(e) => {
						e.preventDefault();
						{setStage(EAuthStage.Auth)}
					}}>
                        <input
                            name='logun'
                            type="text"
                            placeholder="Ваш логин"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                        />    
                        <input
                            name='firstName'
                            type="text"
                            placeholder="Ваше имя"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />  
                        <input
                            name='lastName'
                            type="text"
                            placeholder="Ваша фамилия"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                        <input
                            name='newPassword'
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />   
                        <button type="submit">Зарегистрировать нового пользователя</button>
                        <button type="reset">Отмена</button>                                         
                </form>                
                          
            )}
        </div>
    )
}
