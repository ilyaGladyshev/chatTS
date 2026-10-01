import { IUsersDB, IAuthResponse } from './types/auth';
export declare function readUsersFile(): Promise<IUsersDB>;
export declare function findUserBylogin(login: string, password: string): Promise<IAuthResponse | undefined>;
export declare function findUserByloginOnly(login: string): Promise<IAuthResponse | undefined>;
export declare function createUser(login: string, firstName: string, lastName: string, password: string): Promise<{
    id: string;
    login: string;
    firstName: string;
    lastName: string;
}>;
export declare function writeUsers(usersObject: IUsersDB): Promise<boolean>;
//# sourceMappingURL=dbUsers.d.ts.map