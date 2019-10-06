import {APPROVED_LIST_TYPE} from "./approvedLists";

export interface IProperty {
  _id: string;
  name?: string;
  summary: string;
}

export interface IPropertySearchCriteria {
  search?: string;
  active?: boolean;
  skipAmenities?: boolean;
  limit: number;
  hideCustomComps?: boolean;
  hideCustom?: boolean;
  permission?: string[];
  select?: string;
}

export interface IMassUpdateRequest {
  propertyIds: string[];
  type: APPROVED_LIST_TYPE;
  newValue: string;
  oldValue: string;
}
