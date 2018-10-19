import {IEvent} from "./IEvents";

export interface IPropertyTotalsEvent extends IEvent {
    payload: {
        organization: {
            id: string;
            name: string;
        }
        high_assigned_properties: number;
        high_assigned_units: number;
        high_properties: number;
        high_units: number;

        low_assigned_properties: number;
        low_assigned_units: number;
        low_properties: number;
        low_units: number;

        medium_assigned_properties: number;
        medium_assigned_units: number;
        medium_properties: number;
        medium_units: number;

        total_assigned_properties: number,
        total_assigned_units: number,
        total_properties: number,
        total_units: number,

    };
}
