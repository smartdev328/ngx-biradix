angular.module("biradix.global").factory("$marketSurveyService", ["$propertyService", "$importIntegrationService", "toastr",
    function($propertyService, $importIntegrationService, toastr) {
        var fac = {};

        fac.getPropertyWithSurvey = function(id, surveyid, settings, callback) {
            var responseObj = {};
            $propertyService.search({
                limit: 1,
                permission: ["PropertyManage", "CompManage"],
                ids: [id],
                select: "_id name floorplans contactName contactEmail phone location_amenities community_amenities survey.id survey.date orgid custom pms",
            }).then(function(response) {
                responseObj.property = response.data.properties[0];
                responseObj.hasName = responseObj.property.contactName && responseObj.property.contactName.length > 0;
                responseObj.hasEmail = responseObj.property.contactEmail && responseObj.property.contactEmail.length > 0;
                responseObj.hasPhone = responseObj.property.phone && responseObj.property.phone.length > 0;
                responseObj.hasContact = responseObj.hasName || responseObj.hasEmail || responseObj.hasPhone;

                responseObj.survey = {
                    floorplans: responseObj.property.floorplans,
                    location_amenities: responseObj.property.location_amenities,
                    community_amenities: responseObj.property.community_amenities
                };

                responseObj.survey.floorplans.forEach(function(fp) {
                    fp.rent = fp.rent || "";
                    fp.concessions = (fp.concessions || fp.concessions === 0) ? fp.concessions : "";
                });

                responseObj.survey.atr = responseObj.survey.atr || "";
                responseObj.survey.leased = responseObj.survey.leased || "";
                responseObj.survey.renewal = responseObj.survey.renewal || "";
                responseObj.survey.occupancy = responseObj.survey.occupancy || "";
                responseObj.survey.weeklytraffic = responseObj.survey.weeklytraffic || "";
                responseObj.survey.weeklyleases = responseObj.survey.weeklyleases || "";

                if (responseObj.property.survey && responseObj.property.survey.date) {
                    responseObj.survey.survey_date = responseObj.property.date;
                }

                var editableSurveyId = surveyid;
                if (!editableSurveyId && responseObj.property.survey) {
                    editableSurveyId = responseObj.property.survey.id;
                }

                if (responseObj.property.survey && editableSurveyId) {
                    $propertyService.getSurvey(id, editableSurveyId).then(function(response) {
                        var s = response.data.survey;
                        if (s && s.length > 0) {
                            s = s[0];
                             responseObj.survey.leased = s.leased != null && !isNaN(s.leased) ? s.leased : "";
                            responseObj.survey.atr = s.atr != null && !isNaN(s.atr) ? s.atr : "";
                            responseObj.survey.atr_percent = s.atr_percent != null && !isNaN(s.atr_percent) ? s.atr_percent : "";
                            responseObj.survey.renewal = s.renewal != null && !isNaN(s.renewal) ? s.renewal : "";
                            responseObj.survey.occupancy = s.occupancy != null && !isNaN(s.occupancy) ? s.occupancy : "";
                            responseObj.survey.weeklytraffic = s.weeklytraffic;
                            responseObj.survey.weeklyleases = s.weeklyleases;
                            responseObj.survey.notes = s.notes;
                            responseObj.survey.survey_date = s.date;
                            responseObj.survey.pms = s.pms;
                            settings.showNotes = (s.notes || "") !== "";

                            var removeFloorplans = [];

                            var bFloorplansChanged = false;
                            var old;
                            responseObj.survey.floorplans.forEach(function(fp, i) {
                                old = _.find(s.floorplans, function(ofp) {
                                    return ofp.id.toString() === fp.id.toString();
                                });

                                if (old) {
                                    fp.rent = old.rent;
                                    fp.concessions = old.concessions;
                                    fp.concessionsOneTime = old.concessionsOneTime;
                                    fp.concessionsMonthly = old.concessionsMonthly;

                                    if (surveyid) {
                                        responseObj.survey.floorplans[i] = _.cloneDeep(old);
                                    }
                                }

                                if (typeof fp.concessionsOneTime != "undefined") {
                                    settings.showDetailed = true;
                                }

                                if (!old) {
                                    // Always Keep track of floorplan changes
                                    bFloorplansChanged = true;

                                    // If we are modifying a survey and there is a new floorplan, exclude it
                                    if (surveyid) {
                                        removeFloorplans.push(fp.id.toString());
                                    }
                                }
                            });

                            _.remove(responseObj.survey.floorplans, function(x) {
                                return removeFloorplans.indexOf(x.id.toString()) > -1;
                            });

                            var n;
                            s.floorplans.forEach(function(fp) {
                                n = _.find(responseObj.survey.floorplans, function(nfp) {
                                    return nfp.id.toString() === fp.id.toString();
                                });

                                if (!n) {
                                    // Add missing floorplans from survey being edited
                                    if (surveyid) {
                                        responseObj.survey.floorplans.push(fp);
                                    }
                                    // Always Keep track of floorplan changes
                                    bFloorplansChanged = true;
                                }
                            });

                            // If Adding a new Survey and no changes in floorplans and there is already a survey today, edit that one
                            if (!surveyid && !bFloorplansChanged) {
                                // var hoursOld = ((new Date()).getTime() - (new Date(s.date)).getTime()) / 1000 / 60 / 60;
                                // if (hoursOld < 24) {
                                //    surveyid = s._id;
                                // }
                                var d1 = new Date();
                                var d2 = new Date(s.date);
                                if (d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getYear() === d2.getYear()) {
                                    responseObj.surveyid = s._id;
                                    surveyid = s._id;
                                    responseObj.forcedEdit = true;
                                }
                            }

                            if (surveyid) {
                                responseObj.editMode = true;
                                responseObj.editDate = s.date;
                            }
                        }

                        responseObj.originalSurvey = _.cloneDeep(responseObj.survey);

                        getPMS(responseObj, callback);
                    });
                } else {
                    responseObj.originalSurvey = _.cloneDeep(responseObj.survey);
                    getPMS(responseObj, callback);
                }
            });
        };       

        var getPMS = function(responseObj, callback) {
            if (responseObj.property.pms && responseObj.property.pms.importId && (!responseObj.editMode || responseObj.survey.pms)) {
                responseObj.pms = {};

                var pmsId = "";
                if (responseObj.survey.pms && responseObj.editMode) {
                    pmsId = responseObj.survey.pms.id;
                } else {
                    delete responseObj.survey.pms;
                }

                $importIntegrationService.getFullYardi(responseObj.property._id, pmsId, responseObj.property.pms.yardi.floorplans).then(function(response) {
                    if (!response.data.id) {
                        delete responseObj.pms;
                        return callback(responseObj);
                    }
                    responseObj.pms = response.data;
                    responseObj.pms.show = !pmsId;
                    responseObj.pms.values = {
                        occupancy: "YARDI",
                        leased: "YARDI",
                        atr: "YARDI",
                        weeklytraffic: "YARDI",
                        weeklyleases: "YARDI",
                        rent: {}
                    };
                    responseObj.pms.mappedFloorplans = {};

                    var pmsFp;
                    responseObj.originalSurvey.floorplans.forEach(function(fp) {
                        pmsFp = _.find(responseObj.pms.floorplans, function(x) {
                            return x.biradixid === fp.id;
                        });

                        // If no floorplan is mapped to Yardi, default Biradix Rent
                        if (pmsFp) {
                            responseObj.pms.mappedFloorplans[fp.id] = pmsFp;
                            responseObj.pms.values.rent[fp.id] = "YARDI";
                        } else {
                            responseObj.pms.values.rent[fp.id] = "BIRADIX";
                            responseObj.pms.mappedFloorplans[fp.id] = null;
                        }
                    });

                    callback(responseObj);
                }, function(error) {
                    Raygun.send(new Error("User saw API unavailable error alert/message/page"));
                    toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                });
            } else {
                callback(responseObj);
            }
        };

        return fac;
    }]);

