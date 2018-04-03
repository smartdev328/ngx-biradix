import {IWebContext} from "./IWebContext";

export interface ISearchRequest<C> {
    userJwt?: string;
    criteria: C;
    webContext: IWebContext;
    transactionId?: string;
    revertedFromId?: string;
    skipAudit?: boolean;
}
