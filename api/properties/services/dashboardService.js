'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var PropertyService = require('../services/propertyService')
var DataPointsService = require('../services/dataPointsService')
var SurveyHelperService = require('../services/surveyHelperService')

module.exports = {
    getProfile: function(user,options,checkManaged, subjectId, compId, callback) {
        var timer = new Date().getTime();
        user.settings = user.settings || {};
        async.parallel({
            subject: function (callbackp) {

                if (subjectId == compId) {
                    return callbackp();
                }
                PropertyService.search(user, {limit: 1, permission: ['PropertyView'], _id: subjectId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail website notes fees totalUnits survey location_amenities community_amenities floorplans comps orgid"
                }, function(err, property) {
                    //console.log("Subject DB for " + compId + ": " + (new Date().getTime() - timer) + "ms");
                    callbackp(err, property[0])
                })
            },
            comp: function (callbackp) {
                PropertyService.search(user, {limit: 1, permission: ['PropertyView','PropertyManage','CompManage'], _id: compId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail website notes fees totalUnits survey location_amenities community_amenities floorplans comps orgid"
                }, function(err, property, lookups) {
                    //console.log("Comp DB for " + compId + ": " + (new Date().getTime() - timer) + "ms");
                    callbackp(err, {p: property[0], l: lookups})
                })
            },
            modify: function(callbackp) {

                if (!checkManaged) {
                    return callbackp(null,false);
                }
                PropertyService.search(user, {limit: 1, permission: ['CompManage'], _id: compId
                    , select: "_id"
                }, function(err, property) {
                    callbackp(err, property.length == 1)
                })
            },
            owner: function(callbackp) {

                if (!checkManaged) {
                    return callbackp(null,true);
                }
                PropertyService.search(user, {limit: 1, permission: ['PropertyManage'], _id: compId
                    , select: "_id"
                }, function(err, property) {
                    callbackp(err, property.length == 1)
                })
            }
        }, function(err, all) {

            if (err) {
                return callback(err,null)
            } else {
                var comps = [_.cloneDeep(all.comp.p)];
                if (subjectId == compId) {
                    all.subject = _.cloneDeep(all.comp.p);
                }

                delete all.comp.p.comps;

                async.parallel({
                    comps: function (callbackp) {
                        PropertyService.getLastSurveyStats({
                            hide: user.settings.hideUnlinked,
                            injectFloorplans: true
                        }, all.subject, comps, function() {
                            callbackp(null, comps)
                        })
                    },
                    points: function(callbackp) {
                        DataPointsService.getPoints(user.settings.hideUnlinked, all.subject, comps,
                            false,
                            -1,
                            options.daterange,
                            options.offset,
                            options.show,
                            function(points) {
                                callbackp(null, points)
                            })
                    }
                }, function(err, all2) {
                    all2.comps.forEach(function(c) {
                        if (c.survey) {
                            delete c.floorplans;

                            if (c.survey.date) {
                                var daysSince = (Date.now() - c.survey.date.getTime()) / 1000 / 60 / 60 / 24;
                                if (daysSince >= 15) {
                                    c.survey.tier = "danger";
                                } else if (daysSince >= 8) {
                                    c.survey.tier = "warning";
                                }
                            }
                        }
                    })

                    //console.log("Profile DB for " + compId + ": " + (new Date().getTime() - timer) + "ms");

                    callback(null, {property: all.comp.p, comps: all2.comps, lookups: all.comp.l, points: all2.points, canManage: all.modify, owner: all.owner})

                    for (var s in all) {
                        all[s] = null;
                        delete all[s];
                    }
                    all = null;
                    for (var s in all2) {
                        all2[s] = null;
                        delete all2[s];
                    }
                    all2 = null;
                });
            }

        });

    },

    getDashboard: function(user,id,options,callback) {
        options.injectFloorplans = options.injectFloorplans === false ? false : true;
        var timer = new Date().getTime();
        PropertyService.search(user, {limit: 1, permission: 'PropertyManage', _id: id
            , select: "_id name address city state zip phone contactEmail contactName website owner management constructionType yearBuilt yearRenovated loc totalUnits survey comps"
        }, function(err, property) {

            if (err) {
                return callback(err,null)
            } else {

                if (property.length == 0) {
                    return callback("Access Denied",null)
                }

                var compids = _.pluck(property[0].comps, "id");
                delete property[0].compids;

                PropertyService.search(user, {
                    limit: 20,
                    permission: 'PropertyView',
                    ids: compids
                    ,
                    select: "_id name address city state zip loc totalUnits survey.id floorplans"
                }, function(err, comps) {

                    if (err) {
                        return callback(err,null)
                    } else {
                        //If we pass in a surveyDate, dont use the last survey date in comps.survey.id
                        //Instead get the last survey older then the date given
                        updateCompSurveyIdsByDate(comps,options.surveyDate, function() {
                            async.parallel({
                                comps: function (callbackp) {
                                    PropertyService.getLastSurveyStats({
                                        hide: user.settings.hideUnlinked,
                                        injectFloorplans: options.injectFloorplans
                                    }, property[0], comps, function() {
                                        callbackp(null, comps)
                                    })
                                },
                                points: function(callbackp) {
                                    if (options.skipPoints) {
                                        callbackp(null, null)
                                    }
                                    else {
                                        DataPointsService.getPoints(user.settings.hideUnlinked, property[0], comps,
                                            options.summary,
                                            options.bedrooms,
                                            options.daterange,
                                            options.offset,
                                            options.show,
                                            function (points) {
                                                callbackp(null, points)
                                            })
                                    }
                                }
                            }, function(err, all) {
                                all.comps.forEach(function(c) {
                                    delete c.floorplans;
                                })

                                //console.log("Dashboard DB for " + id + ": " + (new Date().getTime() - timer) + "ms");

                                callback (null,{property: property[0], comps: all.comps, points: all.points});

                                for (var s in all) {
                                    all[s] = null;
                                    delete all[s];
                                }
                                all = null;
                            });

                        })
                    }
                });
            }

        })
    }
}

function updateCompSurveyIdsByDate(comps,surveyDate, callback) {
    if (!surveyDate) {
        callback();
    }
    else {
        async.each(comps, function(comp, callbackp) {
            SurveyHelperService.getSurveyBeforeDate(comp._id, surveyDate, function(err, surveys) {
                if (!surveys || surveys.length == 0) {
                    delete comp.survey;
                } else {
                    comp.survey.id = surveys[0]._id.toString();
                }
                callbackp(null);
            })

        }, function(err, all) {
            callback();
        })

    }
}