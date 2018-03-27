import {OrganizationSearchRequest} from "./OrganizationSearchRequest";
import {OrganizationSearchResponse} from "./OrganizationSearchResponse";

export interface IOrganizationService {
    init(rabbit: any): Promise<string>;
    health(): Promise<string>;
    read(searchRequest: OrganizationSearchRequest): Promise<OrganizationSearchResponse>;
}
