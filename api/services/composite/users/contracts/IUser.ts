export interface IUser {
    first: string;
    last: string;
    email: string;
}

export interface ILoggedInUser extends IUser {
    memberships: {
        isadmin: boolean;
        memberships: string[];
    };
}
