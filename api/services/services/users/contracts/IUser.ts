export interface IUserBase {
    first: string;
    last: string;
    email: string;
}

export interface IUserLoggedIn extends IUserBase {
    memberships: {
        isadmin: boolean;
        memberships: string[];
    };
    permissions: string[];
}
