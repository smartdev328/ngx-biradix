'use strict';
var express = require('express');
var async = require("async");
var Routes = express.Router();
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
    async.waterfall([
        function(callbackw) {
            individualReportsService.getProperties(req.user, req.body.reports, (req.body.compids || []).concat([req.params.id]), function(err,comps,lookups) {
                callbackw(null,comps,lookups)
            });
        },
        function(comps,lookups, callbackw) {
            async.parallel([
                function(callbackp) {
                    results.community_amenities = individualReportsService.community_amenities(req.body.reports,comps,lookups);
                    callbackp();
                },
                function(callbackp) {
                    results.location_amenities = individualReportsService.location_amenities(req.body.reports,comps,lookups);
                    callbackp();
                },
                function(callbackp) {
                    results.fees_deposits = individualReportsService.fees_deposits(req.body.reports,comps,lookups);
                    callbackp();
                },
                function(callbackp) {
                    individualReportsService.floorplans(req.params.id, comps, function(floorplans) {
                        results.floorplans = floorplans;
                        callbackp();
                    });

                },
                function(callbackp) {
                    individualReportsService.property_report(req.user, req.body.reports,req.params.id, (req.body.compids || []), req.body.options.property_report, function(property_report) {
                        results.property_report = property_report;
                        callbackp();
                    });

                },
            ], function(err) {
                callbackw(null,comps,lookups)
            });
        }
    ], function(err) {
        res.status(200).json(results);
        results = null;
    })
});

module.exports = Routes;