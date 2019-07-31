export interface IOrganization {
  _id : string;
  name: string;
  isDefault: boolean;
  logoBig: string;
  logoSmall: string;
  settings: {};
  subdomain: string;
  sso: {
    provider: string;
    newUsers: boolean;
  }
}
