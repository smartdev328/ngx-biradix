import {IEvent} from "./IEvents";

export interface IPropertyTotalsEvent extends IEvent {
    payload: {
        stale_assigned_properties: number;
        stale_assigned_units: number;

        stale_properties: number;
        stale_units: number;

        total_assigned_properties: number,
        total_assigned_units: number,
        total_properties: number,
        total_units: number,

        updated_assigned_properties: number;
        updated_assigned_units: number;

        updated_properties: number;
        updated_units: number;
    };
}
