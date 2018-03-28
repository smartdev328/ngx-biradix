export interface IUserBase {
    first: string;
    last: string;
    email: string;
}

export interface IUserReadLoggedIn extends IUserBase {
    memberships: {
        isadmin: boolean;
        memberships: string[];
    };
    permissions: string[];
}
