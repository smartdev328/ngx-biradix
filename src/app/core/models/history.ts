import {IPager} from "./common";

export interface IHistorySearchCriteria {
  limit: number;
  approved?: boolean;
  daterange: {
    daterange: string;
  },
  offset: number;
}

export interface IHistoryResponse {
  pager: IPager;
  //TODO: Build this out as needed
}
