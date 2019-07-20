import {IOrganization} from "./organization";

export interface ILoggedInUser {
  _id: boolean;
  passwordUpdated: boolean;
  active: boolean;
  isSystem: boolean;
  first: string;
  last: string;
  email: string;
  allowSSO: boolean;
  guestStats: [];
  settings: {};
  version: string;
  maintenance: boolean;
  roles: string[];
  permissions: string[];
  orgs: IOrganization[];
}

export interface IloggedInUserWithToken {
  user: ILoggedInUser;
  token: string;
}
