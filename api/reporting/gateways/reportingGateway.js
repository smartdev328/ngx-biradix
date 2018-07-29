"use strict";
const express = require("express");
const async = require("async");
const Routes = new express.Router();
const progressService = require("../../progress/services/progressService")
const request = require("request");
const moment= require("moment");
const settings = require("../../../config/settings")
const serviceRegistry = require("../../../build/services/gateway/ServiceRegistry");

const propertyStatusService = require("../services/propertyStatusService");
const individualReportsService = require("../services/individualReportsService");

Routes.get("/excel/property_status", (req, res) => {
    serviceRegistry.getShortenerService().retrieve(req.query.key).then((result)=> {
        result = JSON.parse(result);
        propertyStatusService.run(req.user, result.propertyIds, req.user.settings.showLeases, {compAverages: false}, (data) => {
            let fileName = "Portfolio_Report_";
            fileName += moment().utcOffset(result.timezone).format("MM_DD_YYYY");
            fileName += ".xlsx";

            const json = {
                fileName: fileName,
                report: data,
                show: result.settings.show,
                strDate: moment().utcOffset(result.timezone).format("MM/DD/YYYY"),
            };

            const url = settings.EXCEL_URL.replace("/excel", "/property_status")

            const r = request.post(url, {
                json: json,
            }).pipe(res)

            r.on("finish", function() {
                if (result.progressId) {
                    progressService.setComplete(result.progressId);
                }
            });
        });
    });
});

Routes.get("/excel/custom_portfolio", (req, res) => {
    serviceRegistry.getShortenerService().retrieve(req.query.key).then((result)=> {
        result = JSON.parse(result);
        console.log(result.settings);
        propertyStatusService.run(req.user, result.propertyIds, req.user.settings.showLeases, {compAverages: result.settings.compAverages, orderBy: result.settings.orderBy}, (data) => {
            let fileName = "Custom_Portfolio_Report_";
            fileName += moment().utcOffset(result.timezone).format("MM_DD_YYYY");
            fileName += ".xlsx";

            const json = {
                fileName: fileName,
                report: data,
                show: result.settings.show,
                bedrooms: result.settings.bedrooms,
                columnSortOrder: result.columnSortOrder,
                strDate: moment().utcOffset(result.timezone).format("MM/DD/YYYY"),
            };

            const url = settings.EXCEL_URL.replace("/excel", "/custom_portfolio")

            const r = request.post(url, {
                json: json,
            }).pipe(res)

            r.on("finish", function() {
                if (result.progressId) {
                    progressService.setComplete(result.progressId);
                }
            });
        });
    });
});


Routes.post("/group", function(req, res) {
    async.parallel({
        custom_portfolio: function(callbackp) {
            if (req.body.reports.indexOf("custom_portfolio") === -1) {
                return callbackp(null);
            }

            propertyStatusService.run(req.user, req.body.propertyids, req.user.settings.showLeases, {compAverages: req.body.settings.customPortfolio.compAverages, orderBy: req.body.settings.customPortfolio.orderBy}, function(data) {
                callbackp(null, data);
            });
        },
        property_status: function(callbackp) {
            if (req.body.reports.indexOf("property_status") === -1) {
                return callbackp(null);
            }
            propertyStatusService.run(req.user, req.body.propertyids, req.user.settings.showLeases, {compAverages: false}, function (data) {
                callbackp(null, data);
            });
        },
        }, function(err, all) {
        res.status(200).json(all);
        all = null;
        });
});

Routes.post("/:id", function(req, res) {
    let results = {};
    async.waterfall([
        function(callbackw) {
            individualReportsService.getProperties(req.user, req.body.reports, (req.body.compids || []).concat([req.params.id]), function(err, comps, lookups) {
                callbackw(null, comps, lookups);
            });
        },
        function(comps, lookups, callbackw) {
            async.parallel([
                function(callbackp) {
                    results.community_amenities = individualReportsService.community_amenities(req.body.reports, comps, lookups);
                    callbackp();
                },
                function(callbackp) {
                    results.location_amenities = individualReportsService.location_amenities(req.body.reports, comps, lookups);
                    callbackp();
                },
                function(callbackp) {
                    results.fees_deposits = individualReportsService.fees_deposits(req.body.reports, comps, lookups);
                    callbackp();
                },
                function(callbackp) {
                    individualReportsService.floorplans(req.params.id, comps, function(floorplans) {
                        results.floorplans = floorplans;
                        callbackp();
                    });
                },
                function(callbackp) {
                    individualReportsService.property_report(req.user, req.body.reports, req.params.id, (req.body.compids || []), req.body.options.property_report, function(propertyReport) {
                        results.property_report = propertyReport;
                        callbackp();
                    });
                },
                function(callbackp) {
                    individualReportsService.concession(req.user, req.body.reports, req.params.id, (req.body.compids || []), req.body.options.concession, function(concession) {
                        results.concession = concession;
                        callbackp();
                    });
                },
                function(callbackp) {
                    individualReportsService.trends(req.user, req.body.reports, req.params.id, (req.body.compids || []), req.body.options.trends, function(trends) {
                        results.trends = trends;
                        callbackp();
                    });
                },
                function(callbackp) {
                    callbackp();
                },
            ], function(err) {
                callbackw(null, comps, lookups);
            });
        },
    ], function(err) {
        res.status(200).json(results);
        results = null;
    });
});

module.exports = Routes;
