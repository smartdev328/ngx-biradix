import * as express from "express";
import * as propertyService from "../../../api/properties/services/propertyService";
import * as userService from "../../../api/users/services/userService";
import {IPropertySearchRequest} from "../interfaces/IPropertySearchRequest";
import {ICustomError} from "../../services/library/sharedContracts/ICustomError";
import {IProperty} from "../interfaces/IProperty";
import {IPropertyTotalsEvent} from "../../keen/interfaces/IPropertyTotalsEvent";
import {KeenEventType} from "../../keen/interfaces/IEvents";
import {KeenService} from "../../keen/services/keenService";
const routes = express.Router();

routes.get("/daily_totals", (req, res) => {
    userService.getSystemUser((obj) => {
        const SystemUser = obj.user;

        const PropertySearchRequest: IPropertySearchRequest = {
            active: true,
            hideCustom: true,
            limit: 100000,
            select: "name survey totalUnits orgid",
        };

        // Get all Comps
        propertyService.search(SystemUser, PropertySearchRequest, (errors: ICustomError[], properties: IProperty[]) => {
            const event: IPropertyTotalsEvent = {
                payload: {
                    stale_assigned_properties: 0,
                    stale_assigned_units: 0,
                    stale_properties: 0,
                    stale_units: 0,
                    total_assigned_properties: 0,
                    total_assigned_units: 0,
                    total_properties: 0,
                    total_units: 0,
                    updated_assigned_properties: 0,
                    updated_assigned_units: 0,
                    updated_properties: 0,
                    updated_units: 0,
                },
                type: KeenEventType.PROPERTY_TOTALS,
            };

            let stale: boolean;
            let days: number;
            properties.forEach((property: any) => {

                stale = true;
                if (property.survey && property.survey.date) {
                    days = Math.round(((new Date()).getTime() - (new Date(property.survey.date)).getTime()) / 1000 / 60 / 60 / 24);
                    if (days < 31) {
                        stale = false;
                    }
                }

                event.payload.total_properties++;
                event.payload.total_units += property.totalUnits;

                if (stale) {
                    event.payload.stale_properties++;
                    event.payload.stale_units += property.totalUnits;
                } else {
                    event.payload.updated_properties++;
                    event.payload.updated_units += property.totalUnits;
                }

                if (property.orgid) {
                    event.payload.total_assigned_properties++;
                    event.payload.total_assigned_units += property.totalUnits;

                    if (stale) {
                        event.payload.stale_assigned_properties++;
                        event.payload.stale_assigned_units += property.totalUnits;
                    } else {
                        event.payload.updated_assigned_properties++;
                        event.payload.updated_assigned_units += property.totalUnits;
                    }
                }
            });

            KeenService.recordEvent(event);

            res.status(200).json(event);
        });
    });
});

module.exports = routes;
