const AccessService = require("../../access/services/accessService");
const PropertyService = require("../services/propertyService");
const surveyHelperService = require("../services/surveyHelperService");
const moment = require("moment");
const async = require("async");
const _ = require("lodash");

module.exports = {
    init: function(Routes) {
        Routes.get("/:id/survey/guests/:guestid/email", function(req, res) {
            AccessService.canAccessResource(req.user, req.params.id, ["PropertyManage", "CompManage"], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                surveyHelperService.emailGuest(req.user, req.context, req.basePath, req.params.id, req.params.guestid, function(errs) {
                    return res.status(200).json({errors: errs});
                });
            });
        });

        Routes.post("/:id/survey/warnings", function(req, res) {
            AccessService.canAccessResource(req.user, req.params.id, ["PropertyManage", "CompManage"], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                async.parallel(
                    {
                        twoWeeks: function(callbackp) {
                            const end = moment().add(-7, "day");
                            const start = moment(end).add(-14, "day");
                            surveyHelperService.getSurveyBeforeDate(req.params.id, start, end, function(err, surveys) {
                                if (surveys.length == 1) {
                                    surveys = surveys[0];
                                } else {
                                    surveys = null;
                                }
                                callbackp(null, surveys);
                            });
                        },
                        oneMonth: function(callbackp) {
                            const end = moment().add(-24, "day");
                            const start = moment(end).add(-40, "day");
                            surveyHelperService.getSurveyBeforeDate(req.params.id, start, end, function(err, surveys) {
                                if (surveys.length == 1) {
                                    surveys = surveys[0];
                                } else {
                                    surveys = null;
                                }
                                callbackp(null, surveys);
                            });
                        },
                        recent: function(callbackp) {
                            const end = moment().add(1, "day");
                            const start = moment(end).add(-13, "day");
                            surveyHelperService.getSurveyBeforeDate(req.params.id, start, end, function(err, surveys) {
                                if (surveys.length == 1) {
                                    surveys = surveys[0];
                                } else {
                                    surveys = null;
                                }
                                callbackp(null, surveys);
                            });
                        },
                    }, function(err, all) {
                        const errors = [];
                        let n;
                        let o;
                        let fpNer = false;
                        let fpNerAll = true;
                        let old;
                        let oldNer;
                        let newNer;
                        let d;

                        if (all.recent) {
                            o = all.recent;
                            n = req.body;

                            const totalUnitsNew = calculateTotalUnits(n.floorplans);
                            const totalUnitsOld = calculateTotalUnits(o.floorplans);

                            if (totalUnitsNew > 0 || totalUnitsOld > 0) {
                                n = calculateNER(n.floorplans, totalUnitsNew);
                                o = calculateNER(o.floorplans, totalUnitsOld);
                                console.log(n, o);
                                d = Math.abs(n - o);

                                if (d > 0 && o >= 0 && d / o >= .1) {
                                    errors.push({msg: "Property NER has changed by more than 10% since last survey"});
                                }
                            }
                        }

                        if (all.twoWeeks) {
                            o = all.twoWeeks;
                            n = req.body;

                            if (parseFloat(o.occupancy) === parseFloat(n.occupancy)) {
                                errors.push({msg: "Occupancy % has not changed in two weeks"});
                            }

                            if (parseFloat(o.weeklytraffic) === parseFloat(n.weeklytraffic)) {
                                errors.push({msg: "Traffic/Week has not changed in two weeks"});
                            }
                        }

                        if (all.oneMonth) {
                            o = all.oneMonth;
                            n = req.body;

                            if (parseFloat(o.weeklyleases) === parseFloat(n.weeklyleases)) {
                                errors.push({msg: "Leases/Week has not changed in a month"});
                            }

                            n.floorplans.forEach(function(fp) {
                                old = _.find(o.floorplans, function(x) {
                                    return x.id.toString() == fp.id.toString();
                                });

                                if (old && old.rent) {
                                    oldNer = old.rent - old.concessions / 12;
                                    newNer = fp.rent - fp.concessions / 12;
                                    if (parseInt(newNer) == parseInt(oldNer)) {
                                        fpNer = true;
                                    } else {
                                        fpNerAll = false;
                                    }
                                }
                            });

                            if (fpNerAll === true) {
                                errors.push({msg: "<B style='color:#f33'>NER for all floor plans has not changed in one month</B>"});
                            } else if (fpNer) {
                                // errors.push({msg: "NER for some floor plans has not changed in one month "});
                            }
                        }

                        return res.status(200).json({success: errors.length > 0, errors: errors});
                });
            });
        });

        Routes.post("/:id/survey", function(req, res) {
            AccessService.canAccessResource(req.user, req.params.id, ["PropertyManage", "CompManage"], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.createSurvey(req.user, req.context, null, req.params.id, req.body, function(err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    } else {
                        return res.status(200).json({success: true});
                    }
                });
            });
        });

        Routes.delete("/:id/survey/:surveyid", function(req, res) {
            AccessService.canAccessResource(req.user, req.params.id, ["PropertyManage", "CompManage"], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.deleteSurvey(req.user, req.context, null, req.params.surveyid, function(err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    } else {
                        return res.status(200).json({success: true});
                    }
                });
            });
        })

        Routes.put("/:id/survey/:surveyid", function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,["PropertyManage","CompManage"], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.updateSurvey(req.user, req.context, null,req.params.id,req.params.surveyid, req.body, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })

        Routes.get("/:id/survey/:surveyid", function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,["PropertyManage","CompManage"], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.getSurvey({ids: [req.params.surveyid]}, function (err, survey) {
                    if (err) {
                        return res.status(400).json({errors: err});
                    }
                    else {
                        return res.status(200).json({survey: survey});
                    }
                });
            })
        })

        Routes.get("/:id/surveys", function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,["PropertyManage","CompManage"], function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.getSurvey({propertyid: req.params.id, select: "date"}, function (err, survey) {
                    if (err) {
                        return res.status(400).json({errors: err});
                    }
                    else {
                        return res.status(200).json({survey: survey});
                    }
                });
            });
        });
    },
};

function calculateTotalUnits(floorplans) {
    let result = 0;
    floorplans.map((x) => x.units).forEach((x) => result += x);
    return result;
}

function calculateNER(floorplans, totalUnits) {
    let result = 0;
    floorplans.map((x) => x.units * (x.rent - x.concessions / 12)).forEach((x) => result += x);

    result /= totalUnits;

    return result;
}