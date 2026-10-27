import { type IUserPublic } from '../types/auth';
import { useState } from 'react';
import type { IChatData } from '../types/chats';

interface IGroupCreateFromProps{
    usersList: IUserPublic[];
    onGroupCreated: (newChat: IChatData) => void;
}

const CreateGropForm = ({usersList, onGroupCreated}: IGroupCreateFromProps) => {
    const VITE_API_URL = "http://159.194.233.93:5000";
    const [selectedUsersId, setSelectedUserId] = useState<string[]>([]);
    const [groupName, setGroupName] = useState<string>('');

    const handleCheckBoxClick = (selectedId: string) => {
        setSelectedUserId((prev) => prev.includes(selectedId)
            ? prev.filter((userId) => { return userId !== selectedId })
            : [...prev, selectedId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const participants = Array.from(selectedUsersId.values());
            const response = await fetch(`${VITE_API_URL}/api/chats/create`,{
                method: 'POST',
				headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body:JSON.stringify({
                    name: groupName,
                    isGroup: true,
                    participants: participants 
                })
            });
			const newChat = await response.json();
			if (response.ok && newChat) {
				console.log('Создан новый чат!');
				onGroupCreated(newChat);
			}	            
        } catch (error) {
            alert(error);
            console.log("Ошибка создания чата!", error)           
        }
    }

    return (
        <div>
            <h3>Создание нового чата</h3>
            <form onSubmit={handleSubmit} className='form-group'>
                <input  type="text"
                        placeholder='Введите название нового чата'
                        key='groupName'
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}/>
                <h4>Выберите участников группы:</h4>
                {usersList.map((user: IUserPublic) => (
                    <div className='group-participants'>
                        <label>
                            <input key={user.id}
                                type="checkbox"
                                checked={selectedUsersId.includes(user.id)}
                                onClick={() => handleCheckBoxClick(user.id)}/>
                        </label>
                        <div>{user.userName}</div>                    
                    </div>
                ))}
                <button type='submit' 
                    className='create-btn'
                    disabled={groupName.trim() === '' || selectedUsersId.length === 0}>
                    Далее (создать чат)
                </button>
            </form>
        </div>
    )
}

export default CreateGropForm;