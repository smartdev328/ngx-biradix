var _ = require("lodash")
var async = require("async");
var moment = require('moment')
var phantom = require('phantom-render-stream');
var request = require('request')
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var ProgressService = require('../../progress/services/progressService')
var UserService = require('../../users/services/userService')
var AuditService = require('../../audit/services/auditService')
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');
var pdfService = require('../services/pdfService');
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

                    var json = {fileName: fileName,dashboard: dashboard, profiles: profiles, utcOffset: req.query.timezone};

                    //var email = {
                    //    from: 'support@biradix.com',
                    //    to: 'alex@viderman.com',
                    //    subject: 'Excell Json',
                    //    html: JSON.stringify(json)
                    //};
                    //
                    //EmailService.send(email, function(emailError,status) {console.log(emailError,status)});

                    var r = request.post(settings.EXCEL_URL, {
                        json: json
                    }).pipe(res)

                    r.on('finish', function () {
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
            PropertyService.search(req.user, {_id: req.params.id}, function(err, properties) {
                UserService.getFullUser(req.user, function (full) {
                    moment().utcOffset(req.query.timezone);
                    var p = properties[0];
                    var fileName = p.name.replace(/ /g, "_");

                    fileName += "_Report" + moment().format("MM_DD_YYYY");

                    fileName += ".pdf";

                    var options = pdfService.getDefaultOptions();

                    var render = phantom(options);

                    var url = req.protocol + '://' + req.get('host') + "/#/reporting";

                    var cookies = [
                        pdfService.getCookie(req.hostname,"token", full.token),
                        pdfService.getCookie(req.hostname,"compIds", req.query.compIds),
                        pdfService.getCookie(req.hostname,"reportIds", req.query.reportIds),
                        pdfService.getCookie(req.hostname,"subjectId", req.params.id),
                    ];
                    res.setHeader("content-type", "application/pdf");
                    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

                    options.cookies = cookies;
                    var r = render(url, options).pipe(res);

                    r.on('finish', function () {
                        if (req.query.progressId) {
                            ProgressService.setComplete(req.query.progressId)
                        }
                        full = null;
                        cookies = null;
                        r = null;
                        render = null;
                        properties = null;
                        console.log(process.memoryUsage());
                    })
                });
            });

        });

        Routes.get('/:id/pdf', function (req, res) {
            var timer = new Date().getTime();
            queues.getExchange().publish({
                    user: req.user,
                    context : req.context,
                    id: req.params.id,
                    timezone : req.query.timezone,
                    full : req.query.full,
                    url : req.protocol + '://' + req.get('host'),
                    hostname : req.hostname,
                    Graphs : req.query.Graphs,
                    selectedStartDate : req.query.selectedStartDate,
                    selectedEndDate : req.query.selectedEndDate,
                    selectedRange : req.query.selectedRange,
                    progressId : req.query.progressId,

                },
                {
                    key: settings.PDF_PROFILE_QUEUE,
                    reply: function (data) {
                        console.log("Pdf Q for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                        res.setHeader("content-type", "application/pdf");
                        res.setHeader('Content-Disposition', 'attachment; filename=' + data.filename);

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
