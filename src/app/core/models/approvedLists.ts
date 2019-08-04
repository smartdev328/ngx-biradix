export enum APPROVED_LIST_TYPE {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  FEES = "FEES"
}

export const APPROVED_LIST_LABELS: any = {

};

APPROVED_LIST_LABELS[APPROVED_LIST_TYPE.OWNER] = "Property:Owners";
APPROVED_LIST_LABELS[APPROVED_LIST_TYPE.MANAGER] = "Property:Management";
APPROVED_LIST_LABELS[APPROVED_LIST_TYPE.FEES] = "Custom Fees & Deposits";

export interface IUnapprovedListFrequency {
  value: string;
  count?: number;
}

export interface IApprovedListItemWrite {
  value: string;
  type: APPROVED_LIST_TYPE;
  searchable: boolean;
}

export interface IApprovedListItemRead extends IApprovedListItemWrite {
  id: string;
  aliases: string[];
}

export interface IApprovedListSearchCriteria {
  type: APPROVED_LIST_TYPE;
  value?: string;
  searchableOnly: boolean;
  search?: string;
  limit: number;
}
