import {IEvent} from "./IEvents";

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
        contact: {
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
