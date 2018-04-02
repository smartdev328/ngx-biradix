import {IOrganizationSettings} from "./IOrganizationSettings";

export interface IOrganizationWrite {
    name: string;
    subdomain: string;
    logoBig: string;
    logoSmall: string;
    isDefault: boolean;
}

export interface IOrganization extends IOrganizationWrite {
    _id: string;
    settings: IOrganizationSettings;
}
