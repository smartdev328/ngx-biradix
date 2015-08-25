'use strict';
var PropertySchema= require('../schemas/propertySchema')
var SurveySchema= require('../schemas/surveySchema')
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var CompsService = require('./compsService')

module.exports = {
    updateLastSurvey: function(propertyid, callback) {
        SurveySchema.find({propertyid: propertyid}).sort('-date').limit(1).exec(function (err, surveys) {
            if (err) {
                return callback();
            }

            if (!surveys || surveys.length == 0) {
                var query = {_id: propertyid};
                var update = {survey: undefined};
                var options = {new: true};

                PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                    callback()
                })
            }
            else {
                var survey = surveys[0];

                var totUnits = _.sum(survey.floorplans, function (fp) {
                    return fp.units
                });

                if (totUnits > 0) {
                    var ner = Math.round(_.sum(survey.floorplans, function (fp) {
                            return (fp.rent - fp.concessions / 12) * fp.units
                        }) / totUnits);

                    var s = {
                        id: survey._id,
                        occupancy: survey.occupancy,
                        ner: ner,
                        weeklyleases: survey.weeklyleases,
                        weeklytraffic: survey.weeklytraffic
                    }
                    var query = {_id: propertyid};
                    var update = {survey: s};
                    var options = {new: true};

                    PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                        callback()
                    })
                }
                else {
                    var query = {_id: propertyid};
                    var update = {survey: undefined};
                    var options = {new: true};

                    PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                        callback()
                    })
                }
            }

        })
    },
    getSurveyStats: function(floorplans, survey, links, hide) {

        var fps = _.cloneDeep(floorplans);

        var fpids = _.pluck(floorplans, "id").map(function (x) {
            return x.toString()
        })

        var totUnits = _.sum(fps, function (fp) {
            return fp.units
        });
        survey.totUnits = totUnits;

        if (links.excluded === true && hide) {
            links.floorplans = links.floorplans.map(function (x) {
                return x.toString()
            })

            fps = _.filter(fps, function (x) {
                return links.floorplans.indexOf(x.id.toString()) > -1
            })

            var excluded = _.find(fpids, function (x) {
                return links.floorplans.indexOf(x.toString()) == -1
            })

            if (excluded) {
                survey.excluded = true;
            }
        }

        totUnits = _.sum(fps, function (fp) {
            return fp.units
        });

        if (totUnits > 0) {
            survey.sqft = Math.round(_.sum(fps, function (fp) {
                    return (fp.sqft) * fp.units
                }) / totUnits);
            survey.rent = Math.round(_.sum(fps, function (fp) {
                    return (fp.rent) * fp.units
                }) / totUnits);
            survey.concessions = Math.round(_.sum(fps, function (fp) {
                    return (fp.concessions) * fp.units
                }) / totUnits);
            survey.ner = Math.round(survey.rent - (survey.concessions / 12))
            survey.nersqft = Math.round(survey.ner / survey.sqft * 100) / 100
        }
    },
    getSubjectExclusions: function (compid, compFloorplans, callback) {
        CompsService.getSubjects(compid, {select: "_id name comps"}, function (err, obj) {
            var exclusions = [];

            obj.forEach(function (p) {
                var comp = _.find(p.comps, function (c) {
                    return c.id.toString() == compid
                })
                if (comp.excluded) {
                    exclusions.push({subjectid: p._id, floorplans: _.difference(compFloorplans, comp.floorplans)});
                }
            })

            callback(exclusions);
        });
    }
}