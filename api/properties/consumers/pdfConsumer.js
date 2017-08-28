var bus = require("../../../config/queues")
var settings = require("../../../config/settings")
var PropertyService = require("../services/propertyService")
var pdfService = require("../services/pdfService")
var UserService = require('../../users/services/userService')
var moment = require('moment')
var phantom = require('phantom-render-stream');
var AuditService = require('../../audit/services/auditService')
var ProgressService = require('../../progress/services/progressService')

bus.handleQuery(settings.PDF_PROFILE_QUEUE, function(data,reply) {
    console.log(data.id + " pdf started");
    try {
        PropertyService.search(data.user, {_id: data.id, skipAmenities: true}, function (err, properties) {
            UserService.getFullUser(data.user, function (full) {
                var p = properties[0];
                var fileName = p.name.replace(/ /g, "_");

                fileName += "_" + moment().utc().add(data.timezone, "minute").format("MM_DD_YYYY");

                fileName += ".pdf";

                var options = pdfService.getDefaultOptions()

                var render = phantom(options);

                var url = data.url + "/#/profile/" + p._id;

                url = url.replace("https://","http://");

                var cookies = [
                    pdfService.getCookie(data.hostname, "token", full.token),
                    pdfService.getCookie(data.hostname, "Graphs", data.Graphs),
                    pdfService.getCookie(data.hostname, "Scale", data.Scale),
                    pdfService.getCookie(data.hostname, "selectedStartDate", data.selectedStartDate),
                    pdfService.getCookie(data.hostname, "selectedEndDate", data.selectedEndDate),
                    pdfService.getCookie(data.hostname, "selectedRange", data.selectedRange),
                    pdfService.getCookie(data.hostname, "fp.o", data.orderBy),
                    pdfService.getCookie(data.hostname, "fp.s", data.show),
                    pdfService.getCookie(data.hostname, "pr.s", data.showProfile),
                ];


                var description = p.name;

                if (data.full) {
                    description += ' (with Comps)';
                }

                description += " - " + data.selectedRange;

                AuditService.create({
                    type: 'pdf_profile',
                    operator: data.user,
                    property: p,
                    description: description,
                    context: data.context
                })


                options.cookies = cookies;

                var MemoryStream = require('memory-stream');

                var ws = new MemoryStream();


                ws.on('finish', function () {
                    var newBuffer = Buffer.concat(ws.buffer);
                    if (data.progressId) {
                        ProgressService.setComplete(data.progressId)
                    }

                    var JSONB = require('json-buffer')

                    console.log(data.id + " pdf ended");
                    reply({stream: JSONB.stringify(newBuffer), filename: fileName});
                    full = null;
                    cookies = null;
                    r = null;
                    render = null;
                    options = null;
                    properties = null;
                    newBuffer = null;

                    settings.PDF_HIT_COUNT++;
                    ;
                });


                console.log('I am about to render');

                var r = render(url, options).on('error', function(err) {
                    console.log('I errored: ', err.toString());
                    reply({stream: null, err: err.toString()});

                }).pipe(ws);



            });


        })
    }
    catch (ex) {
        console.log('I failed render');
        reply({stream: null, err: ex});
    }

});
bus.handleQuery(settings.PDF_REPORTING_QUEUE, function(data,reply) {
    console.log(data.propertyIds, " reporting pdf started");

    try {
        PropertyService.search(data.user, {_id: data.id, skipAmenities: true, limit : 1}, function (err, properties) {
            UserService.getFullUser(data.user, function (full) {

                var fileName = "";

                if (data.type == "multiple") {
                    fileName = "Portfolio"
                } else {
                    var p = properties[0];
                    fileName = p.name.replace(/ /g, "_");
                }

                fileName += "_Report_" + moment().utc().add(data.timezone, "minute").format("MM_DD_YYYY");

                fileName += ".pdf";

                var options = pdfService.getDefaultOptions();

                var render = phantom(options);

                var url = data.url + "/#/reporting";
                url = url.replace("https://","http://");


                //Manually fix date ranges for now...
                delete data.settings.dashboardSettings.daterange.Ranges;
                delete data.settings.profileSettings.daterange.Ranges;



                if (data.settings.dashboardSettings.daterange.selectedStartDate._d) {
                    data.settings.dashboardSettings.daterange.selectedStartDate = (moment(data.settings.dashboardSettings.daterange.selectedStartDate._d).format());
                    data.settings.dashboardSettings.daterange.selectedEndDate = (moment(data.settings.dashboardSettings.daterange.selectedEndDate._d).format());

                    data.settings.profileSettings.daterange.selectedStartDate = (moment(data.settings.profileSettings.daterange.selectedStartDate._d).format());
                    data.settings.profileSettings.daterange.selectedEndDate = (moment(data.settings.profileSettings.daterange.selectedEndDate._d).format());
                }

                if (data.settings.concession) {
                    delete data.settings.concession.daterange.Ranges;
                    if (data.settings.concession.daterange.selectedStartDate && data.settings.concession.daterange.selectedStartDate._d) {
                        data.settings.concession.daterange.selectedStartDate = (moment(data.settings.concession.daterange.selectedStartDate._d).format());
                        data.settings.concession.daterange.selectedEndDate = (moment(data.settings.concession.daterange.selectedEndDate._d).format());
                    }
                }

                var cookies = [
                    pdfService.getCookie(data.hostname, "token", full.token),
                    pdfService.getCookie(data.hostname, "compIds", data.compIds),
                    pdfService.getCookie(data.hostname, "reportIds", data.reportIds),
                    pdfService.getCookie(data.hostname, "type", data.type),
                    pdfService.getCookie(data.hostname, "propertyIds", data.propertyIds),
                    pdfService.getCookie(data.hostname, "settings", encodeURIComponent(JSON.stringify(data.settings))),
                ];

                options.cookies = cookies;


                var MemoryStream = require('memory-stream');

                var ws = new MemoryStream();


                ws.on('finish', function () {
                    var newBuffer = Buffer.concat(ws.buffer);
                    if (data.progressId) {
                        ProgressService.setComplete(data.progressId)
                    }

                    var JSONB = require('json-buffer')

                    console.log(data.propertyIds, " pdf reporting ended");
                    reply({stream: JSONB.stringify(newBuffer), filename: fileName});
                    full = null;
                    cookies = null;
                    r = null;
                    render = null;
                    options = null;
                    properties = null;
                    newBuffer = null;
                    settings.PDF_HIT_COUNT++;
                    ;
                });

                var r = render(url, options).on('error', function(err) {
                    console.log('I errored: ', err.toString());
                    reply({stream: null, err: err.toString()});

                }).pipe(ws);
            });
        });
    }
    catch (ex) {
        reply({stream: null, err: ex.toString()});
    }

});

