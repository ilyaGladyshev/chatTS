import type { IUserPublic, IUserProfile } from "../types/auth";
import {useState, useEffect} from "react";

export interface IContactProps{
    currentUser: IUserProfile;
    onSelectContact: (targetUser: IUserPublic) => void;
    userList: IUserPublic[];
}

const ContactList = ({currentUser, onSelectContact, userList}: IContactProps) => {
    const [filteredUsers, setFilteredUsers] = useState<IUserPublic[]>([]);
    useEffect(() =>{
        setFilteredUsers(userList.filter(user => {return user.id != currentUser.id}));
    }, []);
    
    return (
        <div>
            {...filteredUsers.map((user) => (
                <button className="button-chat"
                        key = {user.id}
                        onClick={() => onSelectContact(user)}>
                    {user.userName}
                </button>
            ))}
        </div>
    );
}
export default ContactList;