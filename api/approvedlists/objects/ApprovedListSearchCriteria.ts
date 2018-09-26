import {ApprovedListType} from "./ApprovedLists";

export interface IApprovedListSearchCriteria {
    type: ApprovedListType;
    value?: string;
    searchableOnly: boolean;
    search?: string;
    limit: number;
}
