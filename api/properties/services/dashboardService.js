'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var PropertyService = require('../services/propertyService')
var DataPointsService = require('../services/dataPointsService')
var CompsService = require('../services/compsService')
var SurveyHelperService = require('../services/surveyHelperService')
var error = require('../../../config/error')
var localCacheService = require('../../utilities/services/localcacheService')

module.exports = {
    getProfile: function(user,options,checkManaged, subjectId, compId, callback) {
        var timer = new Date().getTime();
        user.settings = user.settings || {};
        async.parallel({
            subject: function (callbackp) {

                if (subjectId == compId) {
                    return callbackp();
                }

                var key = "view_" + user._id.toString()+"_"+subjectId;
                var prop = localCacheService.get(key);

                if (prop) {
                    return callbackp(null,prop)
                }

                PropertyService.search(user, {limit: 1, permission: ['PropertyView'], _id: subjectId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail website notes fees totalUnits survey location_amenities community_amenities floorplans comps orgid needsSurvey"
                    , skipAmenities: true
                }, function(err, property) {
                    localCacheService.set(key, property[0], 2)
                    callbackp(err, property[0])
                })
            },
            comp: function (callbackp) {
                PropertyService.search(user, {limit: 1, permission: ['PropertyView','PropertyManage','CompManage'], _id: compId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail website notes fees totalUnits survey location_amenities community_amenities floorplans comps orgid needsSurvey"
                }, function(err, property, lookups) {
                    if (err || !property || property.length == 0) {
                        return callbackp('Unable to find property')
                    }
                    //console.log("Comp DB for " + compId + ": " + (new Date().getTime() - timer) + "ms");
                    callbackp(err, {p: property[0], l: lookups})
                })
            },
            modify: function(callbackp) {
                if (!checkManaged) {
                    return callbackp(null,false);
                }

                PropertyService.search(user, {limit: 1, permission: ['CompManage','PropertyManage'], _id: compId
                    , select: "_id"
                    , skipAmenities: true
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
                    , skipAmenities: true
                }, function(err, property) {
                    callbackp(err, property.length == 1)
                })
            }
        }, function(err, all) {
            console.log("Profile All Loop: " + (new Date().getTime() - timer) / 1000 + "s");

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
                        var timer1 = new Date().getTime();
                        PropertyService.getLastSurveyStats({
                            hide: user.settings.hideUnlinked,
                            injectFloorplans: true
                        }, all.subject, comps, function() {
                            console.log("Profile getLastSurveyStats: " + (new Date().getTime() - timer1) / 1000 + "s");
                            callbackp(null, comps)
                        })
                    },
                    points: function(callbackp) {
                        var timer1 = new Date().getTime();
                        DataPointsService.getPoints(user.settings.hideUnlinked, all.subject, comps,
                            false,
                            -1,
                            options.daterange,
                            options.offset,
                            options.show,
                            function(points) {
                                console.log("Profile getPoints: " + (new Date().getTime() - timer1) / 1000 + "s");
                                callbackp(null, points)
                            })
                    }
                }, function(err, all2) {

                    var daysSince;
                    all2.comps.forEach(function(c) {
                        if (c.survey) {
                            delete c.floorplans;
                            if (c.survey.date) {
                                daysSince = (Date.now() - c.survey.date.getTime()) / 1000 / 60 / 60 / 24;
                                if (daysSince >= 15) {
                                    c.survey.tier = "danger";
                                } else if (daysSince >= 8) {
                                    c.survey.tier = "warning";
                                }
                            }
                        }
                    })

                    //console.log("Profile DB for " + compId + ": " + (new Date().getTime() - timer) + "ms");

                    var canSurvey = all.modify;
                    if (!all.owner && all.comp.p.orgid) {
                        canSurvey = false;
                    }

                    if (!all2.comps[0].survey || !all2.comps[0].survey.dateByOwner || (Date.now() - new Date(all2.comps[0].survey.dateByOwner).getTime()) / 1000 / 60 / 60 / 24 >= 15) {
                        canSurvey = true;
                    }

                    //Guests cannot survey properties they do not manage
                    if (canSurvey && !all.modify && user.roles[0] == 'Guest') {
                        canSurvey = false;
                    }

                    callback(null, {property: all.comp.p, comps: all2.comps, lookups: all.comp.l, points: all2.points, canManage: all.modify, owner: all.owner, canSurvey : canSurvey})

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
            , skipAmenities: true
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
                    select: "_id name address city state zip loc totalUnits survey.id survey.dateByOwner floorplans orgid needsSurvey constructionType yearBuilt"
                    , skipAmenities: true
                }, function(err, comps) {

                    //pre-comupte a lookup for datest by owner for locks
                    var datesByOner = {};

                    comps.forEach(function(c) {
                        if (c.survey && c.survey.dateByOwner) {
                            datesByOner[c._id.toString()] = c.survey.dateByOwner;
                        }
                    })

                    if (err) {
                        return callback(err,null)
                    } else {

                        //If we pass in a surveyDate, dont use the last survey date in comps.survey.id
                        //Instead get the last survey older then the date given
                        updateCompSurveyIdsByDate(comps,options.surveyDateStart,options.surveyDateEnd, function() {
                            async.parallel({
                                comps: function (callbackp) {
                                    PropertyService.getLastSurveyStats({
                                        hide: user.settings.hideUnlinked,
                                        injectFloorplans: options.injectFloorplans,
                                        nerPlaces : options.nerPlaces
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
                                },
                                owned: function(callbackp) {
                                    PropertyService.search(user, {permission: ['PropertyManage'], ids: compids
                                        , select: "_id"
                                        , skipAmenities: true
                                        , limit: 30
                                    }, function(err, property) {

                                        if (err || !property) {
                                            error.send(err, {property: property, compids: compids, id: id});

                                            return callbackp(err, [])
                                        }


                                        property.push({ _id: id }) // add subject to the list of owned
                                        callbackp(err, property)
                                    })
                                },
                                shared : function(callbackp) {
                                    var key = "shared_comps_" + id;
                                    var shared = localCacheService.get(key);

                                    if (shared) {
                                        return callbackp(null,shared)
                                    }

                                    //Get all Subjects for All Comps.
                                    //Calculate counts for comps in multiple subjects among the group
                                    CompsService.getSubjects(compids, {select: "_id name comps.id"}, function(err, subjects) {


                                        if (err || !subjects) {
                                            error.send(err, {subjects: subjects, compids: compids, id: id});

                                            return callbackp(err, {})
                                        }

                                        var shared = {};

                                        subjects.forEach(function(x) {
                                            x.comps.forEach(function(y) {
                                                //Do not count yourself as a comp or current subject as a comp
                                                if (y.id.toString() != x._id.toString() && id.toString() != x._id.toString() ) {

                                                    if (!shared[y.id.toString()]) {
                                                        shared[y.id.toString()] = [];
                                                    }
                                                    shared[y.id.toString()].push(x.name);
                                                }
                                            })
                                        })
                                        localCacheService.set(key, shared, 30)

                                        callbackp(err, shared);
                                    })
                                }
                            }, function(err, all) {

                                var comp;

                                all.comps.forEach(function(c) {
                                    delete c.floorplans;
                                    c.orderNumber = 999;
                                    comp = _.find(property[0].comps, function(x) {return x.id.toString() == c._id.toString() })

                                    if (comp && typeof comp.orderNumber != 'undefined') {
                                        c.orderNumber = comp.orderNumber;
                                    }

                                    if (c._id.toString() == property[0]._id.toString()) {
                                        c.orderNumber = -1;
                                    }

                                    c.canSurvey = true;
                                    c.otherSubjects = all.shared[c._id.toString()];

                                    if (c.orgid && !_.find(all.owned, function(x) {return x._id.toString() == c._id.toString()})) {
                                        c.canSurvey = false;
                                    }

                                    if (!datesByOner[c._id.toString()] || (Date.now() - new Date(datesByOner[c._id.toString()]).getTime()) / 1000 / 60 / 60 / 24 >= 15) {
                                        c.canSurvey = true;
                                    }

                                    // console.log(c.canSurvey,all.owned,c._id);
                                })

                                //console.log("Dashboard DB for " + id + ": " + (new Date().getTime() - timer) + "ms");

                                all.comps = _.sortByAll(all.comps,['orderNumber','name']);

                                var minDate;
                                var g;
                                var l;
                                //Remove all points for lifetime older then subject property
                                if (options.daterange && options.daterange.daterange == "Lifetime" && all.points[id] && all.points[id].ner) {
                                    minDate = all.points[id].ner[0].d;
                                    for (g in all.points) {
                                        if (g != id && typeof all.points[g] === 'object') {
                                            for (l in all.points[g]) {
                                                _.remove(all.points[g][l], function(x) {return x.d < minDate});
                                            }
                                        }
                                    }
                                }

                                all.comps.forEach(function(comp) {
                                    comp.survey.floorplans = _.sortByAll(comp.survey.floorplans, ['bedrooms', 'bathrooms', 'sqft', 'description'])
                                });

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

function updateCompSurveyIdsByDate(comps,surveyDateStart,surveyDateEnd, callback) {
    if (!surveyDateStart || !surveyDateEnd) {
        callback();
    }
    else {
        async.each(comps, function(comp, callbackp) {
            if (!comp.survey) {
                callbackp(null);
                return;
            }

            SurveyHelperService.getSurveyBeforeDate(comp._id, surveyDateStart,surveyDateEnd, function(err, surveys) {
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