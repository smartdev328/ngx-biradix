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
var DashboardService = require('../services/dashboardService')
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');

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

                    var options = getDefaultOptions();

                    var render = phantom(options);

                    var url = req.protocol + '://' + req.get('host') + "/#/reporting";

                    var cookies = [
                        getCookie(req,"token", full.token),
                        getCookie(req,"compIds", req.query.compIds),
                        getCookie(req,"reportIds", req.query.reportIds),
                        getCookie(req,"subjectId", req.params.id),
                    ];
                    res.setHeader("content-type", "application/pdf");
                    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

                    options.cookies = cookies;
                    var r = render(url, options).pipe(res);

                    r.on('finish', function () {
                        if (req.query.progressId) {
                            ProgressService.setComplete(req.query.progressId)
                        }
                    })
                });
            });

        });

        Routes.get('/:id/pdf', function (req, res) {
            PropertyService.search(req.user, {_id: req.params.id}, function(err, properties) {
                UserService.getFullUser(req.user, function(full) {
                    moment().utcOffset(req.query.timezone);

                    var p = properties[0];
                    var fileName = p.name.replace(/ /g, "_");

                    if (req.query.full == "true") {
                        fileName += '_and_Comps';
                    }

                    fileName += "_" + moment().format("MM_DD_YYYY");

                    fileName += ".pdf";

                    var options = getDefaultOptions()

                    var render = phantom(options);

                    var url = req.protocol + '://' + req.get('host') + "/#/" + (req.query.full == "true" ? "full" : "profile") + "/" + p._id;

                    var cookies = [
                        getCookie(req,"token", full.token),
                        getCookie(req,"Graphs", req.query.Graphs),
                        getCookie(req,"selectedStartDate", req.query.selectedStartDate),
                        getCookie(req,"selectedEndDate", req.query.selectedEndDate),
                        getCookie(req,"selectedRange", req.query.selectedRange),
                    ];

                    var description = p.name;

                    if (req.query.full == "true") {
                        description += ' (with Comps)';
                    }

                    description += " - " + req.query.selectedRange;

                    AuditService.create({type: 'pdf_profile', operator: req.user, property: p, description: description, context: req.context})

                    res.setHeader("content-type", "application/pdf");
                    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

                    options.cookies = cookies;
                    var r = render(url, options).pipe(res);

                    r.on('finish', function () {
                        if (req.query.progressId) {
                            ProgressService.setComplete(req.query.progressId)
                        }
                    })
                });




            })

        });
    }
}

var getDefaultOptions = function() {
    var options = {
        pool        : 5,           // Change the pool size. Defaults to 1
        timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
        format      : 'pdf',      // The default output format. Defaults to png
        quality     : 100,         // The default image quality. Defaults to 100. Only relevant for jpeg format.
        width       : 1280,        // Changes the width size. Defaults to 1280
        height      : 960,         // Changes the height size. Defaults to 960
        paperFormat : 'Letter',        // Defaults to A4. Also supported: 'A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'.
        orientation : 'portrait',  // Defaults to portrait. 'landscape' is also valid
        margin      : '0.1in',       // Defaults to 0cm. Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'.
        userAgent   : '',          // No default.
        headers     : {}, // Additional headers to send with each upstream HTTP request
        paperSize   : null,        // Defaults to the paper format, orientation, and margin.
        crop        : false,       // Defaults to false. Set to true or {top:5, left:5} to add margin
        printMedia  : false,       // Defaults to false. Force the use of a print stylesheet.
        maxErrors   : 3,           // Number errors phantom process is allowed to throw before killing it. Defaults to 3.
        expects     : true, // No default. Do not render until window.renderable is set to 'something'
        retries     : 2,           // How many times to try a render before giving up. Defaults to 1.
        phantomFlags: [], // Defaults to []. Command line flags passed to phantomjs
        maxRenders  : 20,          // How many renders can a phantom process make before being restarted. Defaults to 20
    };

    return options;
}

var getCookie = function(req,name,value) {
    return   {
        'name': name, /* required property */
        'value': value, /* required property */
        'domain': req.hostname,
        'path': '/', /* required property */
        'httponly': false,
        'secure': false,
        'expires': (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
    }
}