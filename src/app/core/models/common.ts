export interface ILegacyResponse {
  success: boolean;
  errors?: [{param: string; msg: string}];
}
