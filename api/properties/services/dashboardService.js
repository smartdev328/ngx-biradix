'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var PropertyService = require('../services/propertyService')
var DataPointsService = require('../services/dataPointsService')

module.exports = {
    getProfile: function(user,options,checkManaged, subjectId, compId, callback) {
        async.parallel({
            subject: function (callbackp) {
                PropertyService.search(user, {limit: 1, permission: 'PropertyView', _id: subjectId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits survey location_amenities community_amenities floorplans comps orgid"
                }, function(err, property) {
                    callbackp(err, property[0])
                })
            },
            comp: function (callbackp) {
                PropertyService.search(user, {limit: 1, permission: 'PropertyView', _id: compId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits survey location_amenities community_amenities floorplans orgid"
                }, function(err, property, lookups) {
                    callbackp(err, {p: property[0], l: lookups})
                })
            },
            modify: function(callbackp) {

                if (!checkManaged) {
                    return callbackp(null,false);
                }
                PropertyService.search(user, {limit: 1, permission: 'CompManage', _id: compId
                    , select: "_id"
                }, function(err, property) {
                    callbackp(err, property.length == 1)
                })
            }
        }, function(err, all) {

            if (err) {
                return callback(err,null)
            } else {

                PropertyService.search(user, {
                    limit: 1,
                    permission: 'PropertyView',
                    ids: [compId]
                    ,
                    select: "_id name address city state zip loc totalUnits survey.id floorplans"
                }, function(err, comps) {
                    async.parallel({
                        comps: function (callbackp) {
                            PropertyService.getLastSurveyStats(user.settings.hideUnlinked, all.subject, comps, function() {
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

                        callback(null, {property: all.comp.p, comps: all2.comps, lookups: all.comp.l, points: all2.points, canManage: all.modify})

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
                })

            }

        });

    },

    getDashboard: function(user,id,options,callback) {
        PropertyService.search(user, {limit: 1, permission: 'PropertyManage', _id: id
            , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated loc totalUnits survey comps"
        }, function(err, property) {

            if (err) {
                return callback(err,null)
            } else {
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
                        async.parallel({
                            comps: function (callbackp) {
                                PropertyService.getLastSurveyStats(user.settings.hideUnlinked, property[0], comps, function() {
                                    callbackp(null, comps)
                                })
                            },
                            points: function(callbackp) {
                                DataPointsService.getPoints(user.settings.hideUnlinked, property[0], comps,
                                    options.summary,
                                    options.bedrooms,
                                    options.daterange,
                                    options.offset,
                                    options.show,
                                    function(points) {
                                        callbackp(null, points)
                                    })
                            }
                        }, function(err, all) {
                            all.comps.forEach(function(c) {
                                delete c.floorplans;
                            })
                            callback (null,{property: property[0], comps: all.comps, points: all.points});

                            for (var s in all) {
                                all[s] = null;
                                delete all[s];
                            }
                            all = null;
                        });


                    }
                });
            }

        })
    }
}