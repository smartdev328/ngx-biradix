export enum KeenEventType {
    SURVEYSWAP_ADDED_TO_PROPERTY = "SurveySwap_Added_To_Property",
}

export interface IEvent {
    env: string;
    type: KeenEventType;
    payload: any;
}

export interface ISurveySwap_Added_To_PropertyEvent extends IEvent {
    payload: {
        property: {
            id: string;
            name: string;
        },
        user: {
            id: string;
            name: string;
            organization: {
                id: string;
                name: string;
            },
        },
        contact: {
            name: string;
            email: string;
            domain: string;
        },
    };
}
