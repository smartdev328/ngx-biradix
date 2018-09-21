import {ApprovedListType} from "./ApprovedLists";

export interface IApprovedListSearchCriteria {
    type: ApprovedListType;
    value?: string;
    activeOnly: boolean;
}
