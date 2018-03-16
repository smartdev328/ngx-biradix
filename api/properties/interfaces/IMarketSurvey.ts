import {IMarketSurveyFloorplan} from "./IMarketSurveyFloorplan";

export interface IMarketSurvey {
    _id?: string;
    leased?: number;
    atr?: number;
    atr_percent?: number;
    renewal?: number;
    occupancy?: number;
    weeklytraffic: number;
    weeklyleases: number;
    propertyid: string;
    floorplans: IMarketSurveyFloorplan[];
}
