export enum KeenEventType {
    SURVEYSWAP_ADDED_TO_PROPERTY = "SurveySwap Added To Property",
    SURVEYSWAP_REQUESTED = "SurveySwap Requested",
}

export interface IEvent {
    type: KeenEventType;
    payload: any;
}
