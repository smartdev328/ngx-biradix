import {ILoggedInUser} from "../../../composite/users/contracts/IUser";
import {SearchRequest} from "../../../library/sharedContracts/SearchRequest";
import {IOrganizationCriteria} from "./IOrganizationCriteria";

export class OrganizationSearchRequest extends SearchRequest<ILoggedInUser, IOrganizationCriteria> {

}
