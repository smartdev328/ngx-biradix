import {IOrganizationSettings} from "./IOrganizationSettings";

export interface IOrganization {
    _id: string;
    name: string;
    subdomain: string;
    logoBig: string;
    logoSmall: string;
    isDefault: boolean;
    settings: IOrganizationSettings;
}