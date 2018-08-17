import {IEvent} from "./IEvents";

export interface IPropertySurveyEvent extends IEvent {
    payload: {
        property: {
            id: string;
            organization: {
                id: string;
                name: string;
            },
            name: string;
        },
        user: {
            id: string;
            name: string;
            organization: {
                id: string;
                name: string;
            },
            role: string;
        },
    };
}
