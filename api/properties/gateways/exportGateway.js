var _ = require("lodash")
var async = require("async");
var moment = require('moment')
var request = require('request')
var ProgressService = require('../../progress/services/progressService')
var organizationService = require('../../organizations/services/organizationService')
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');
var bus = require('../../../config/queues')
var JSONB = require('json-buffer')
var redisService = require('../../utilities/services/redisService')
var error = require('../../../config/error')
var exportService = require('../services/exportService');


module.exports = {
    init: function(Routes) {
        Routes.get('/csvreport/:org', function(req, res) {
            res.setHeader('Content-disposition', 'attachment; filename=' + req.params.org + '.csv');
            res.setHeader('Content-type', 'text/csv');

            exportService.getCsv(req.user, req.params.org, null, function(string) {
                res.write(string);
                res.end()
            })
        })

        Routes.get('/:id/excel', function (req, res) {

            redisService.getByKey(req.query.key, function(err, result) {
                var query = {};

                if (result) {
                    query = JSON.parse(result);
                }

                var profiles = [];
                req.body.show = {};
                req.body.show.graphs = false;
                req.body.show.ner = true;
                req.body.show.occupancy = true;
                req.body.show.leased = true;
                req.body.show.bedrooms = true;
                req.body.bedrooms = -1;
                req.body.summary = false;
                req.body.compids = query.compids;

                req.body.daterange =
                    {
                        daterange: query.selectedRange,
                        start: query.selectedStartDate,
                        end: query.selectedEndDate
                    }

                queueService.getDashboard(req, function (err, dashboard) {
                    async.eachLimit(dashboard.comps, 1, function (comp, callbackp) {
                        req.body.show.traffic = true;
                        req.body.show.leases = true;
                        req.body.show.bedrooms = true;

                        queueService.getProfile(req.user, req.body, false, dashboard.property._id, comp._id, function (err, profile) {
                            profiles.push(profile)
                            callbackp(err);
                        })
                    }, function (err) {

                        moment().utcOffset(query.timezone);

                        var p = dashboard.property;
                        var fileName = p.name.replace(/ /g, "_") + '_and_Comps_';

                        fileName += moment().format("MM_DD_YYYY");

                        fileName += ".xlsx";

                        profiles.forEach(function (c) {
                            var comp = _.find(dashboard.comps, function (x) {
                                return x._id.toString() == c.property._id.toString()
                            });

                            c.orderNumber = 999;

                            if (comp && typeof comp.orderNumber != 'undefined') {
                                c.orderNumber = comp.orderNumber;
                            }
                            c.name = comp.name;
                        });

                        profiles = _.sortByAll(profiles, ['orderNumber', 'name']);

                        var json = {
                            fileName: fileName,
                            dashboard: dashboard,
                            profiles: profiles,
                            utcOffset: query.timezone,
                            settings: {
                                showLeases: req.user.settings.showLeases
                            }
                        };

                        var timer = new Date().getTime();
                        var r = request.post(settings.EXCEL_URL, {
                            json: json
                        }).pipe(res)

                        r.on('finish', function () {
                            console.log("Excel AppHarbor for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                            if (query.progressId) {
                                ProgressService.setComplete(query.progressId)
                            }
                            dashboard = null;
                            profiles = null;
                            r = null;
                            json = null;
                        })

                    });

                })
            });
        });

        Routes.get("/reportsPdf", function(req, res) {
            let timer = new Date().getTime();
            redisService.getByKey(req.query.key, function(err, result) {
                let query = {};

                if (result) {
                    query = JSON.parse(result);
                }

                let message = {
                    user: req.user,
                    url: req.basePath,
                    timezone: query.timezone,
                    hostname: req.hostname,
                    progressId: query.progressId,
                    reportIds: query.reportIds,
                    compIds: query.compIds,
                    type: query.type,
                    propertyIds: query.propertyIds,
                    settings: query.settings,
                };

                bus.query(settings.PDF_REPORTING_QUEUE,
                    message,
                    function(data) {
                        let log = {"property_ids": query.propertyIds, "user": req.user.email, "name": data.filename, "pdf_time_ms": (new Date().getTime() - timer)};
                        console.log(log);

                        if (!data.stream) {
                            error.send(new Error(data.err), message);
                            return res.status("200").send("There was an error generating this report. Please contact an administrator");
                        }

                        res.setHeader("Content-Type", "application/pdf");

                        if (query.showFile) {
                            res.setHeader('Content-Disposition', 'attachment; filename=' + data.filename);
                        }

                        var stream = require('stream');
                        var bufferStream = new stream.PassThrough();
                        bufferStream.end(JSONB.parse(data.stream));
                        bufferStream.pipe(res)

                        data = null;

                    }
                );
            })

        });

        Routes.get('/:id/pdf', function (req, res) {
            var timer = new Date().getTime();

            redisService.getByKey(req.query.key, function(err, result) {
                var query = {};

                if (result) {
                    query = JSON.parse(result);
                }

                //console.log(query, typeof query.showFile, typeof query.full);

                var message = {
                    user: req.user,
                    context : req.context,
                    url : req.basePath,
                    hostname : req.hostname,
                    id: req.params.id,
                    timezone : query.timezone,
                    Graphs : query.Graphs,
                    Scale : query.Scale,
                    selectedStartDate : query.selectedStartDate,
                    selectedEndDate : query.selectedEndDate,
                    selectedRange : query.selectedRange,
                    progressId : query.progressId,
                    orderBy : query.orderBy,
                    show : query.show,
                    showProfile : query.showP,

                };

                bus.query(settings.PDF_PROFILE_QUEUE,message,
                    function (data) {
                        console.log("Pdf Q for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");

                        if (!data.stream) {
                            error.send(new Error(data.err),message);
                            return res.status("200").send("There was an error generating this report. Please contact an administrator");
                        }

                        res.setHeader("content-type", "application/pdf");

                        if (query.showFile) {
                            res.setHeader('Content-Disposition', 'attachment; filename=' + data.filename);
                        }

                        var stream = require('stream');
                        var bufferStream = new stream.PassThrough();
                        bufferStream.end(JSONB.parse(data.stream));
                        bufferStream.pipe(res)

                        data = null;

                    }
                );
            });


        });
    }
}


var CSVEncode = function(s) {
    var result = s.replace(/"/g, '""');
    if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
    return result;
}