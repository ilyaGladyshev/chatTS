export interface UserProfile {
    id: string;
    login: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
}
 export interface AuthResponse {
    status: 'success' | 'wrong_password' | 'not_found';
    error?: string;
    user?: UserProfile;
 }
 export interface UsersDB{
     [login: string]: UserProfile;
 }