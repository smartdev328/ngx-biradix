export enum ALERT_TYPE {
  AMENITIES,
  DATA_INTEGRITY,
  PROPERTY_OWNERS,
  PROPERTY_MANAGERS,
  CUSTOM_FEES,
}

export interface IAlert {
  type: ALERT_TYPE;
  url?: string;
  route?: string;
  routeParams?: any;
  count: number;
  label: string;
}
