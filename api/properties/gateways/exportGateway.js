var _ = require("lodash")
var async = require("async");
var moment = require('moment')
var phantom = require('phantom-render-stream');
var request = require('request')
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var ProgressService = require('../../progress/services/progressService')
var AuditService = require('../../audit/services/auditService')
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');
var queues = require('../../../config/queues')
var JSONB = require('json-buffer')

module.exports = {
    init: function(Routes) {
        Routes.get('/:id/excel', function (req, res) {

            var profiles = [];
            req.body.show = {};
            req.body.show.graphs = false;
            req.body.show.selectedBedroom = -1;
            req.body.show.ner = true;
            req.body.show.occupancy = true;
            req.body.show.leased = true;
            req.body.daterange =
            {
                daterange: req.query.selectedRange,
                start: req.query.selectedStartDate,
                end: req.query.selectedEndDate
            }

            queueService.getDashboard(req, function(err,dashboard) {
                async.eachLimit(dashboard.comps, 10, function(comp, callbackp){
                    req.body.show.traffic = true;
                    req.body.show.leases = true;
                    req.body.show.bedrooms = true;

                    queueService.getProfile(req.user,req.body, false, dashboard.property._id, comp._id, function(err,profile) {
                        profiles.push(profile)
                        callbackp(err);
                    })
                }, function(err) {

                    moment().utcOffset(req.query.timezone);

                    var p = dashboard.property;
                    var fileName = p.name.replace(/ /g, "_") + '_and_Comps_';

                    fileName += moment().format("MM_DD_YYYY");

                    fileName += ".xlsx";

                    profiles = _.sortBy(profiles, function (n) {

                        if (n.property._id.toString() == dashboard.property._id.toString()) {
                            return "-1";
                        }
                        return n.property.name;
                    })

                    var json = {fileName: fileName,dashboard: dashboard, profiles: profiles, utcOffset: req.query.timezone, settings: {
                        showLeases: req.user.settings.showLeases
                    }};

                    //var email = {
                    //    from: 'support@biradix.com',
                    //    to: 'alex@viderman.com',
                    //    subject: 'Excell Json',
                    //    html: JSON.stringify(json)
                    //};
                    //
                    //EmailService.send(email, function(emailError,status) {console.log(emailError,status)});

                    var timer = new Date().getTime();
                    var r = request.post(settings.EXCEL_URL, {
                        json: json
                    }).pipe(res)

                    r.on('finish', function () {
                        console.log("Excel AppHarbor for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                        if (req.query.progressId) {
                            ProgressService.setComplete(req.query.progressId)
                        }
                        dashboard = null;
                        profiles = null;
                        r = null;
                        json = null;
                    })

                });

            })


        });

        Routes.get('/:id/reportsPdf', function (req, res) {
            var timer = new Date().getTime();
            queues.getExchange().publish({
                    user: req.user,
                    id: req.params.id,
                    url : req.basePath,
                    timezone : req.query.timezone,
                    hostname : req.hostname,
                    progressId : req.query.progressId,
                    reportIds : req.query.reportIds,
                    compIds : req.query.compIds
                },
                {
                    key: settings.PDF_REPORTING_QUEUE,
                    reply: function (data) {
                        console.log("Pdf Reporting Q for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                        res.setHeader("content-type", "application/pdf");

                        if (req.query.showFile) {
                            res.setHeader('Content-Disposition', 'attachment; filename=' + data.filename);
                        }

                        var stream = require('stream');
                        var bufferStream = new stream.PassThrough();
                        bufferStream.end(JSONB.parse(data.stream));
                        bufferStream.pipe(res)

                        data = null;

                    }
                }
            );

        });

        Routes.get('/:id/pdf', function (req, res) {
            var timer = new Date().getTime();
            queues.getExchange().publish({
                    user: req.user,
                    context : req.context,
                    id: req.params.id,
                    timezone : req.query.timezone,
                    full : req.query.full,
                    url : req.basePath,
                    hostname : req.hostname,
                    Graphs : req.query.Graphs,
                    selectedStartDate : req.query.selectedStartDate,
                    selectedEndDate : req.query.selectedEndDate,
                    selectedRange : req.query.selectedRange,
                    progressId : req.query.progressId,
                    orderBy : req.query.orderBy,
                    show : req.query.show,
                    orderByComp : req.query.orderByC,
                    showComp : req.query.showC,
                    showProfile : req.query.showP,

                },
                {
                    key: settings.PDF_PROFILE_QUEUE,
                    reply: function (data) {
                        console.log("Pdf Q for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                        res.setHeader("content-type", "application/pdf");

                        if (req.query.showFile) {
                            res.setHeader('Content-Disposition', 'attachment; filename=' + data.filename);
                        }

                        var stream = require('stream');
                        var bufferStream = new stream.PassThrough();
                        bufferStream.end(JSONB.parse(data.stream));
                        bufferStream.pipe(res)

                        data = null;

                    }
                }
            );


        });
    }
}
