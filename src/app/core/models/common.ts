export interface ILegacyResponse {
  success: boolean;
  errors?: [{param: string; msg: string}];
}

export interface ILegacyResponseSingleError {
  success: boolean;
  errors?: string;
}

export interface IPager {
  count: number,
  itemsPerPage: number;
  currentPage: number;
  offset: number;
}
