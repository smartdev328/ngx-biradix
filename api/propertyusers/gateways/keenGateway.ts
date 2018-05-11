import * as express from "express";
import * as compsService from "../../../api/properties/services/compsService";
import * as propertyService from "../../../api/properties/services/propertyService";
import * as userService from "../../../api/users/services/userService";
import {KeenEventType} from "../../keen/interfaces/IEvents";
import {ISurveySwapTotals} from "../../keen/interfaces/ISurveySwapEvents";
import {KeenService} from "../../keen/services/keenService";
import {IComp, IProperty} from "../../properties/interfaces/IProperty";
import {IPropertySearchRequest} from "../../properties/interfaces/IPropertySearchRequest";
import {ISubjectSearchRequest} from "../../properties/interfaces/ISubjectSearchRequest";
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

            // Get all Comps
            propertyService.search(SystemUser, PropertySearchRequest, (errors: ICustomError[], properties: IProperty[]) => {
                const compIds: string[] = properties.map((x) => x._id);

                const SubjectSearchRequest: ISubjectSearchRequest = {
                    active: true,
                    select: "_id name comps.id",
                };

                // Get All Subjects that match all the comps
                compsService.getSubjects(compIds, SubjectSearchRequest, (subjectErrors: ICustomError[], subjects: IProperty[]) => {
                    let goodComps: string[] = [];
                    subjects.forEach((subject) => {
                        goodComps = goodComps.concat(subject.comps.map((x) => x.id.toString()));
                    });

                    // Get unique list
                    goodComps = goodComps.filter((x, i, a) => a.indexOf(x) === i );

                    // Filter out only comps that have active subjcets
                    properties = properties.filter((p) => goodComps.indexOf(p._id.toString()) > -1);

                    const compsTotal: number = properties.length;
                    let compsConfigured: number = 0;
                    let configuredFound: boolean;
                    let compsRequesting: number = 0;
                    let requestingFound: boolean;
                    let compsResponding: number = 0;
                    let respondingFound: boolean;
                    let days: number;

                    properties.forEach((property) => {
                        configuredFound = false;
                        requestingFound = false;
                        respondingFound = false;
                        users.forEach((user) => {
                            user.guestStats.forEach((stat) => {
                                if (stat.propertyid.toString() === property._id.toString()) {
                                    if (!configuredFound) {
                                        compsConfigured++;
                                    }
                                    configuredFound = true;

                                    if (stat.lastCompleted) {
                                        days = Math.round(((new Date()).getTime() - (new Date(stat.lastCompleted)).getTime()) / 1000 / 60 / 60 / 24);
                                        if (days < 15) {
                                            if (!respondingFound) {
                                                compsResponding++;
                                            }
                                            respondingFound = true;
                                        }
                                    }

                                    if (stat.lastEmailed) {
                                        days = Math.round(((new Date()).getTime() - (new Date(stat.lastEmailed)).getTime()) / 1000 / 60 / 60 / 24);
                                        if (days < 15) {
                                            if (!requestingFound) {
                                                compsRequesting++;
                                            }
                                            requestingFound = true;
                                        }
                                    }
                                }
                            });
                        });
                    });

                    const event: ISurveySwapTotals = {
                        payload: {
                            comps_configured: compsConfigured,
                            comps_requesting: compsRequesting,
                            comps_responding: compsResponding,
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
});

module.exports = routes;
