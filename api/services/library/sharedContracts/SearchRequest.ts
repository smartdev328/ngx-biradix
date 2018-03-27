import {ISearchRequest} from "./ISearchRequest";
import {IWebContext} from "./IWebContext";

export class SearchRequest<U, C> implements ISearchRequest<U, C> {
    public loggedInUser?: U;
    public criteria: C;
    public webContext: IWebContext;
    public transactionId?: string;
    public revertedFromId?: string;
    public skipAudit?: boolean;
}
