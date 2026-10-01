export interface IUserProfile {
    id: string;
    login: string;
    firstName: string;
    lastName: string;
    passwordHash?: string;
}
export interface IUserPublic {
    id: string;
    userName: string;
}
export interface IAuthResponse {
    status: 'success' | 'wrong_password' | 'not_found';
    error?: string;
    user?: IUserProfile;
}
export declare enum EAuthStage {
    Auth = 0,
    EnterNewuser = 1,
    Succes = 2,
    Cancel = 3
}
export interface IUsersDB {
    lastId: string;
    users: {
        [login: string]: IUserProfile;
    };
}
//# sourceMappingURL=auth.d.ts.map