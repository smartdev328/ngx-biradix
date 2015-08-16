'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var PropertyService = require('../services/propertyService')
var DataPointsService = require('../services/dataPointsService')

module.exports = {
    getProfile: function(req,res,checkManaged, subjectId, compId, callback) {
        async.parallel({
            subject: function (callbackp) {
                PropertyService.search(req.user, {limit: 1, permission: 'PropertyView', _id: subjectId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits survey location_amenities community_amenities floorplans comps"
                }, function(err, property) {
                    callbackp(err, property[0])
                })
            },
            comp: function (callbackp) {
                PropertyService.search(req.user, {limit: 1, permission: 'PropertyView', _id: compId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits survey location_amenities community_amenities floorplans"
                }, function(err, property, lookups) {
                    callbackp(err, {p: property[0], l: lookups})
                })
            },
            modify: function(callbackp) {

                if (!checkManaged) {
                    return callbackp(null,false);
                }
                PropertyService.search(req.user, {limit: 1, permission: 'PropertyManage', _id: req.params.id
                    , select: "_id"
                }, function(err, property) {
                    callbackp(err, property.length == 1)
                })
            }
        }, function(err, all) {

            if (err) {
                res.status(400).send(err)
            } else {

                PropertyService.search(req.user, {
                    limit: 1,
                    permission: 'PropertyView',
                    ids: [compId]
                    ,
                    select: "_id name address city state zip loc totalUnits survey.id floorplans"
                }, function(err, comps) {
                    async.parallel({
                        comps: function (callbackp) {
                            PropertyService.getLastSurveyStats(req.user.settings.hideUnlinked, all.subject, comps, function() {
                                callbackp(null, comps)
                            })
                        },
                        points: function(callbackp) {
                            DataPointsService.getPoints(req.user.settings.hideUnlinked, all.subject, comps,
                                false,
                                -1,
                                req.body.daterange,
                                req.body.offset,
                                req.body.show,
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

                        callback({property: all.comp.p, comps: all2.comps, lookups: all.comp.l, points: all2.points, canManage: all.modify})
                    });
                })

            }

        });

    },

    getDashboard: function(req,res,callback) {
        PropertyService.search(req.user, {limit: 1, permission: 'PropertyManage', _id: req.params.id
            , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated loc totalUnits survey comps"
        }, function(err, property) {

            if (err) {
                res.status(400).send(err)
            } else {
                var compids = _.pluck(property[0].comps, "id");
                delete property[0].compids;

                PropertyService.search(req.user, {
                    limit: 20,
                    permission: 'PropertyView',
                    ids: compids
                    ,
                    select: "_id name address city state zip loc totalUnits survey.id floorplans"
                }, function(err, comps) {

                    if (err) {
                        res.status(400).send(err)
                    } else {
                        async.parallel({
                            comps: function (callbackp) {
                                PropertyService.getLastSurveyStats(req.user.settings.hideUnlinked, property[0], comps, function() {
                                    callbackp(null, comps)
                                })
                            },
                            points: function(callbackp) {
                                DataPointsService.getPoints(req.user.settings.hideUnlinked, property[0], comps,
                                    req.body.summary,
                                    req.body.bedrooms,
                                    req.body.daterange,
                                    req.body.offset,
                                    req.body.show,
                                    function(points) {
                                        callbackp(null, points)
                                    })
                            }
                        }, function(err, all) {
                            all.comps.forEach(function(c) {
                                delete c.floorplans;
                            })
                            callback ({property: property[0], comps: all.comps, points: all.points});
                        });


                    }
                });
            }

        })
    }
}