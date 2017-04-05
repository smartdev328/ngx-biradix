'use strict';
var express = require('express');
var async = require("async");
var _ = require("lodash")
var Routes = express.Router();
/////////////////////////////////
var PropertyHelperService = require('../../properties/services/propertyHelperService')
var PropertyService = require('../../properties/services/propertyService')
/////////////////////
var propertyStatusService = require('../services/propertyStatusService')
var individualReportsService = require('../services/individualReportsService')


Routes.post('/group', function (req, res) {
    propertyStatusService.run( req.user, req.body.propertyids, req.user.settings.showLeases, function(data) {
        res.status(200).json({"property_status" : data});
    })
});

Routes.post('/:id', function (req, res) {

    var results = {};

    individualReportsService.getProperties(req.user, req.body.reports, (req.body.compids || []).concat([req.params.id]), function(err,comps,lookups) {

        if (req.body.reports.indexOf('community_amenities')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {

                c.community_amenities.forEach(function(a) {
                    var v = _.find(lookups.amenities, function(x) {return x._id.toString() == a}).name;
                    compreport.push([c.name, v]);
                })
            })

            results.community_amenities = compreport

        }

        if (req.body.reports.indexOf('location_amenities')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {

                c.location_amenities.forEach(function(a) {
                    var v = _.find(lookups.amenities, function(x) {return x._id.toString() == a}).name;
                    compreport.push([c.name, v]);
                })
            })
            results.location_amenities = compreport
        }

        if (req.body.reports.indexOf('fees_deposits')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {
                for (var f in c.fees) {
                    compreport.push([c.name, lookups.fees[f], c.fees[f]]);
                }

            })
            results.fees_deposits = compreport
        }

        async.parallel({
            floorplans: function (callbackp) {
                var surveyids = _.pluck(comps,"survey.id");
                if (!surveyids || surveyids.length == 0) {
                    callbackp(null, null)
                } else {
                    PropertyService.getSurvey({ids: surveyids,select: "propertyid floorplans"}, function(err, surveys) {
                        var property_rankings = [];

                        var allIncludedFloorplans = PropertyHelperService.flattenAllCompFloorplans(comps, req.params.id);
                        surveys.forEach(function(s) {
                            s.floorplans.forEach(function(fp) {
                                var f = {fid: fp.id, id: s.propertyid, bedrooms: fp.bedrooms, bathrooms: fp.bathrooms, description: fp.description, units: fp.units, sqft: fp.sqft, ner: Math.round((fp.rent - (fp.concessions / 12)) * 100) / 100, nersqft: Math.round((fp.rent - (fp.concessions / 12)) / fp.sqft * 100) / 100};

                                var included = _.find(allIncludedFloorplans, function(x) {return x.toString() == fp.id.toString()})

                                if (!included) {
                                    f.excluded = true;
                                }
                                property_rankings.push(f)
                            })
                        })

                        callbackp(null, property_rankings)
                    });
                }
            }
        }, function(err, all) {

            if (all.floorplans) {
                results.floorplans = all.floorplans;
            }

            res.status(200).json(results);
            all = null;
            results = null;
        });
    })

});



module.exports = Routes;