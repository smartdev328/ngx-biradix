import {IEvent} from "./IEvents";

export interface ISurveySwapTotals extends IEvent {
    payload: {
        comps_total: number;
        comps_participating: number;
        comps_participating_percent: number;
        comps_setup: number;
        comps_setup_percent: number;
    };
}

export interface ISurveySwapEvent extends IEvent {
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
        survery_swap_contact: {
            name: string;
            email: string;
            domain: string;
        },
    };
}

export interface ISurveySwapAddedToPropertyEvent extends ISurveySwapEvent {

}

export interface ISurveySwapRequestedEvent extends ISurveySwapEvent {

}

export interface ISurveySwapRespondedEvent extends ISurveySwapEvent {
    responseTimeInMinutes: number;
}
