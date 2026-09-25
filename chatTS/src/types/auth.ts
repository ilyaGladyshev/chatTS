export interface UserProfile {
    id: string;
    login: string;
    firstName: string;
    lastName: string;
}
 export interface AuthResponse {
    status: 'success' | 'wrong_password' | 'not_found';
    error?: string;
    user?: UserProfile;
 }