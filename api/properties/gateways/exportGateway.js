var _ = require("lodash")
var async = require("async");
var moment = require('moment')
var request = require('request')
var ProgressService = require('../../progress/services/progressService')
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');
var bus = require('../../../config/queues')
var JSONB = require('json-buffer')
var error = require('../../../config/error')
var exportService = require('../services/exportService');
const serviceRegistry = require("../../../build/services/gateway/ServiceRegistry");
const uuid = require("node-uuid");
const redis = require('redis');
const redisClient = redis.createClient(settings.REDIS_URL);

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
            serviceRegistry.getShortenerService().retrieve(req.query.key).then((result)=> {
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

                        let strRange = "";
                        if (moment(query.selectedEndDate).format("MM/DD/YYYY") !== moment().format("MM/DD/YYYY")) {
                            strRange = moment(query.selectedStartDate).format("MM/DD/YYYY") + " - " + moment(query.selectedEndDate).format("MM/DD/YYYY");
                        }

                        let json = {
                            fileName: fileName,
                            dashboard: dashboard,
                            profiles: profiles,
                            utcOffset: query.timezone,
                            settings: {
                                showLeases: req.user.settings.showLeases
                            },
                            strDate: moment().utcOffset(query.timezone).format("MM/DD/YYYY"),
                            strRange,
                        };

                        var timer = new Date().getTime();
                        var r = request.post(settings.EXCEL_URL, {
                            json: json,
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
            serviceRegistry.getShortenerService().retrieve(req.query.key).then((result)=> {
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
                    transaction_id: uuid.v1(),
                    showFile: query.showFile,
                };

                res.status(200).send("OK");

                bus.query(settings.PDF_REPORTING_QUEUE,
                    message,
                    function(data) {
                        let log = {"event": "Pdf complete process (report)", "transaction_id": message.transaction_id, "property_ids": query.propertyIds, "user": req.user.email, "name": data.filename, "pdf_time_ms": (new Date().getTime() - timer)};
                        console.log(JSON.stringify(log));

                        if (!data.stream) {
                            error.send(JSON.stringify(data.err), message);
                            // console.error(data.err);
                        } else {
                            redisClient.set("report-" + query.progressId, JSON.stringify({
                                data,
                                showFile: query.showFile,
                            }), function(err, res) {
                                if (query.progressId) {
                                    ProgressService.setComplete(query.progressId);
                                }
                            });
                            redisClient.expire("report-" + query.progressId, 300);
                        }

                        data = null;
                    }
                );
            });
        });

        Routes.get("/downloadPdf", function(req, res) {
            const progressId = req.query.id;

            if (!progressId) {
                return res.status(200).send("Invalid Link");
            }

            redisClient.get("report-" + progressId, (err, result) => {
                if (result) {
                    const json = JSON.parse(result);
                    res.setHeader("Content-Type", "application/pdf");

                    // if (json.showFile) {
                        res.setHeader("Content-Disposition", "attachment; filename=" + json.data.filename);
                    // }

                    const stream = require("stream");
                    const bufferStream = new stream.PassThrough();
                    bufferStream.end(JSONB.parse(json.data.stream));
                    bufferStream.pipe(res);
                    delete json;
                    delete result;
                } else {
                    console.error("This report has expired, please re-run it");
                    res.status(200).send("This report has expired, please re-run it");
                }
            });
        });

        Routes.get('/:id/pdf', function (req, res) {
            let timer = new Date().getTime();

            serviceRegistry.getShortenerService().retrieve(req.query.key).then((result)=> {
                let query = {};

                if (result) {
                    query = JSON.parse(result);
                }

                let message = {
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
                    transaction_id: uuid.v1(),
                    showFile: query.showFile,
                };

                bus.query(settings.PDF_PROFILE_QUEUE, message,
                    function(data) {
                        let log = {"event": "Pdf complete process (profile)", "transaction_id": message.transaction_id, "property_ids": query.propertyIds, "user": req.user.email, "name": data.filename, "pdf_time_ms": (new Date().getTime() - timer)};
                        console.log(JSON.stringify(log));

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
    },
};