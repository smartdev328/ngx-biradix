export enum AMENITY_TYPE {
  COMMUNITY = "Community",
  LOCATION = "Location",
  UNIT = "Unit",
}

export interface IAmenitySearchCriteria {
  active?: boolean;
  unapproved?: boolean;
  id?: string;
}

export interface IAmenity {
  _id: string;
  name: string;
  type: AMENITY_TYPE;
  approved: boolean;
  deleted: boolean;
  aliases?: string[];
}
