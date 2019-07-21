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
}
