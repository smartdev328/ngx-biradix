import {IWebContext} from "./IWebContext";

export interface ISearchRequest<U, C> {
    loggedInUser?: U;
    criteria: C;
    webContext: IWebContext;
    transactionId?: string;
    revertedFromId?: string;
    skipAudit?: boolean;
}
