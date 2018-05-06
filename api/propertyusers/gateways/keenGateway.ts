import * as express from "express";
import * as propertyService from "../../../api/properties/services/propertyService";
import * as userService from "../../../api/users/services/userService";
import {KeenEventType} from "../../keen/interfaces/IEvents";
import {ISurveySwapTotals} from "../../keen/interfaces/ISurveySwapEvents";
import {KeenService} from "../../keen/services/keenService";
import {IProperty} from "../../properties/interfaces/IProperty";
import {IPropertySearchRequest} from "../../properties/interfaces/IPropertySearchRequest";
import {ICustomError} from "../../services/library/sharedContracts/ICustomError";
import {IUserSearchCriteria} from "../../users/interfaces/IUserSearchCriteria";
const routes = express.Router();

routes.get("/daily_totals", (req, res) => {
    userService.getSystemUser((obj) => {
        const SystemUser = obj.user;

        const UserSearchCriteria: IUserSearchCriteria = {
            active: true,
            roleTypes: ["Guest"],
            select: "name guestStats",
        };

        userService.search(SystemUser, UserSearchCriteria, (errorsUser: ICustomError[], users: any) => {
            const PropertySearchRequest: IPropertySearchRequest = {
                active: true,
                hideCustom: true,
                limit: 100000,
                noorgid: true,
                select: "name",
            };
            propertyService.search(SystemUser, PropertySearchRequest, (errors: ICustomError[], properties: IProperty[]) => {
                const compsTotal: number = properties.length;
                let compsParticipating: number = 0;
                let compsSetup: number = 0;
                let setupFound: boolean;
                let participatingFound: boolean;
                let daysSinceCompleted: number;
                properties.forEach((property) => {
                    setupFound = false;
                    participatingFound = false;
                    users.forEach((user) => {
                        user.guestStats.forEach((stat) => {
                            if (stat.propertyid.toString() === property._id.toString()) {
                                if (!setupFound) {
                                    compsSetup++;
                                }
                                setupFound = true;

                                if (stat.lastCompleted) {
                                    daysSinceCompleted = Math.round(((new Date()).getTime() - (new Date(stat.lastEmailed)).getTime()) / 1000 / 60 / 60 / 24);
                                    if (daysSinceCompleted < 15) {
                                        if (!participatingFound) {
                                            compsParticipating++;
                                        }
                                        participatingFound = true;
                                    }
                                }
                            }
                        });
                    });
                });

                const event: ISurveySwapTotals = {
                    payload: {
                        comps_participating: compsParticipating,
                        comps_participating_percent: compsTotal ? Math.round(compsParticipating / compsTotal * 100 * 10) / 10 : 0,
                        comps_setup: compsSetup,
                        comps_setup_percent: compsTotal ? Math.round(compsSetup / compsTotal * 100 * 10) / 10 : 0,
                        comps_total: compsTotal,
                    },
                    type: KeenEventType.SURVEYSWAP_TOTALS,
                };

                KeenService.recordEvent(event);

                res.status(200).json(event);

            });
        });

    });
});

module.exports = routes;
