import * as express from "express";
import * as propertyService from "../../../api/properties/services/propertyService";
import * as userService from "../../../api/users/services/userService";
import {IPropertySearchRequest} from "../interfaces/IPropertySearchRequest";
import {IProperty} from "../interfaces/IProperty";
import {IPropertyTotalsEvent} from "../../keen/interfaces/IPropertyTotalsEvent";
import {KeenEventType} from "../../keen/interfaces/IEvents";
import {KeenService} from "../../keen/services/keenService";
import * as jwt from "jsonwebtoken";

import {IUserLoggedIn} from "../../services/services/users/contracts/IUser";
import {getOrganizationService} from "../../services/gateway/ServiceRegistry";
import * as settings from "../../../config/settings";
import {IOrganization} from "../../services/services/organizations/contracts/IOrganization";
const routes = express.Router();

routes.get("/daily_totals", async (req, res) => {
    const systemUser: IUserLoggedIn = await userService.getSystemUserAsync();

    const systemUserJwt = jwt.sign({data: systemUser}, settings.SECRET, {expiresIn: 30 * 60});
    const organizations = await getOrganizationService().read({criteria: {}, userJwt: systemUserJwt, webContext: {ip: "", user_agent: ""}});

    const PropertySearchRequest: IPropertySearchRequest = {
        active: true,
        hideCustom: true,
        limit: 100000,
        select: "name survey totalUnits orgid",
    };

    // Get all Comps
    const properties: IProperty[] = await propertyService.searchAsync(systemUser, PropertySearchRequest);

    const enum UPDATED {
        LOW,
        MEDIUM,
        HIGH,
    }
    let state: UPDATED;

    let days: number;
    const events = {};
    let key;
    let org;
    properties.forEach((property: any) => {
        key = property.orgid || "-";
        org = "Unassigned";

        if (property.orgid) {
            org = organizations.data.find((o) => {
               return o._id.toString() === property.orgid.toString();
            });
            if (org) {
                org = org.name;
            }
        }
        events[key] = events[key] || {
            payload: {
                organization: {
                    id: key,
                    name: org,
                },
                high_assigned_properties: 0,
                high_assigned_units: 0,
                high_properties: 0,
                high_units: 0,
                low_assigned_properties: 0,
                low_assigned_units: 0,
                low_properties: 0,
                low_units: 0,
                medium_assigned_properties: 0,
                medium_assigned_units: 0,
                medium_properties: 0,
                medium_units: 0,
                total_assigned_properties: 0,
                total_assigned_units: 0,
                total_properties: 0,
                total_units: 0,
            },
            type: KeenEventType.PROPERTY_TOTALS,
        } as IPropertyTotalsEvent;
        state = UPDATED.LOW;
        if (property.survey && property.survey.date) {
            days = Math.round(((new Date()).getTime() - (new Date(property.survey.date)).getTime()) / 1000 / 60 / 60 / 24);
            if (days <= 10) {
                state = UPDATED.HIGH;
            } else if (days <= 30) {
                state = UPDATED.MEDIUM;
            }
        }

        events[key].payload.total_properties++;
        events[key].payload.total_units += property.totalUnits;

        if (state === UPDATED.HIGH) {
            events[key].payload.high_properties++;
            events[key].payload.high_units += property.totalUnits;
        } else if (state === UPDATED.MEDIUM) {
            events[key].payload.medium_properties++;
            events[key].payload.medium_units += property.totalUnits;
        } else {
            events[key].payload.low_properties++;
            events[key].payload.low_units += property.totalUnits;
        }

        if (property.orgid) {
            events[key].payload.total_assigned_properties++;
            events[key].payload.total_assigned_units += property.totalUnits;

            if (state === UPDATED.HIGH) {
                events[key].payload.high_assigned_properties++;
                events[key].payload.high_assigned_units += property.totalUnits;
            } else if (state === UPDATED.MEDIUM) {
                events[key].payload.medium_assigned_properties++;
                events[key].payload.medium_assigned_units += property.totalUnits;
            } else {
                events[key].payload.low_assigned_properties++;
                events[key].payload.low_assigned_units += property.totalUnits;
            }
        }
    });

    let eventKey;
    for (eventKey in events) {
        KeenService.recordEvent(events[eventKey]);
    }

    res.status(200).json(events);
});

module.exports = routes;
