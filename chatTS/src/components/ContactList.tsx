import type { IUserPublic, IUserProfile } from "../types/auth";
import {useState, useEffect} from "react";

export interface IContactProps{
    currentUser: IUserProfile;
    onSelectContact: (targetUser: IUserPublic) => void;
}

const ContactList = ({currentUser, onSelectContact}: IContactProps) => {
    const [userList, setUserList] = useState<IUserPublic[]>([]);
    useEffect(() =>{
        async function fetchUsers() {
            try {
                const response = await fetch('/api/auth/usersName');
                const logins = await response.json();
                const filteredLogins = logins.filter((item: IUserPublic) => 
                    item.userName != currentUser.firstName + " " + currentUser.lastName);
                setUserList(filteredLogins);			
            } catch (error) {
                console.error('Не удалось загрузить пользователей', error);	
            }
        }
        fetchUsers();
    }, []);
    
    return (
        <div>
            {...userList.map((currentValue) => (
                <button className="button-chat"
                        onClick={() => onSelectContact(currentValue)}>
                    {currentValue.userName}
                </button>
            ))}
        </div>
    );
}
export default ContactList;