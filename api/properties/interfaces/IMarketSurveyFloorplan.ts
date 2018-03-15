import {IFloorplan} from "./IFloorplan";

export interface IMarketSurveyFloorplan extends IFloorplan {
    concessions: number;
    rent: number;
    concessionsMonthly?: number;
    concessionsOneTime?: number;
}
