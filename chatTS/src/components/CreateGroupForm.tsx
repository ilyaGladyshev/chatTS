import { type IUserProfile, type IUserPublic } from '../types/auth';
import { useState } from 'react';
interface IGroupCreateFromProps{
    usersList: IUserPublic[];
    onGroupCreated: (newChatId: string) => void;
}

const CreateGropForm = ({usersList, onGroupCreated}: IGroupCreateFromProps) => {
    const [selectedUsersId, setSelectedUserId] = useState<string[]>([]);
    const [groupName, setGroupName] = useState<string>('');

    const handleCheckBoxClick = (selectedId: string) => {
        setSelectedUserId((prev) => prev.includes(selectedId)
            ? prev.filter((userId) => { return userId !== selectedId })
            : [...prev, selectedId]
        )
    }

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chats/create',{
                method: 'POST',
				headers: {
                    'Content-Type': '/application/json',
                    'Authorization': `Brearer ${token}`
                },
                body:JSON.stringify({
                    name: groupName,
                    isGroup: true,
                    participaints: selectedUsersId
                })
            });
			const newChatId = await response.json();
			if (response.ok && newChatId){
				console.log('Создан новый чат!');
				onGroupCreated(newChatId);
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
                    <div className='group-participaints'>
                        <label key={user.id}>
                            <input type="checkbox"
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