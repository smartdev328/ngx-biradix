export enum ALERT_TYPE {
  AMENITIES,
  DATA_INTEGRITY,
  PROPERTY_OWNERS,
  PROPERTY_MANAGERS,
  CUSTOM_FEES,
}

export interface IAlert {
  type: ALERT_TYPE;
  url: string;
  count: number;
  label: string;
}
