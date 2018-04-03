import {SearchRequest} from "../../../library/sharedContracts/SearchRequest";
import {IUserLoggedIn} from "../../users/contracts/IUser";
import {IOrganizationCriteria} from "./IOrganizationCriteria";

export class OrganizationSearchRequest extends SearchRequest<IUserLoggedIn, IOrganizationCriteria> {

}
