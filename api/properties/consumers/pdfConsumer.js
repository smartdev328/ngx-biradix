var queues = require("../../../config/queues")
var settings = require("../../../config/settings")
var PropertyService = require("../services/propertyService")
var pdfService = require("../services/pdfService")
var UserService = require('../../users/services/userService')
var moment = require('moment')
var phantom = require('phantom-render-stream');
var AuditService = require('../../audit/services/auditService')
var ProgressService = require('../../progress/services/progressService')

queues.getPdfProfileQueue().consume(function(data,reply) {
    console.log(data.id + " pdf started");
    try {
        PropertyService.search(data.user, {_id: data.id}, function (err, properties) {
            UserService.getFullUser(data.user, function (full) {
                var p = properties[0];
                var fileName = p.name.replace(/ /g, "_");

                if (data.full) {
                    fileName += '_and_Comps';
                }

                //console.log(data.timezone, 'Naked: ',moment().format());
                //console.log('Utc: ',moment().utc().format());
                //console.log('Utc Offset: ',moment().utc().utcOffset(data.timezone).format());
                //console.log('Add: ',moment().utc().add(data.timezone,"minute").format());

                fileName += "_" + moment().utc().add(data.timezone, "minute").format("MM_DD_YYYY");

                fileName += ".pdf";

                var options = pdfService.getDefaultOptions()

                var render = phantom(options);

                var url = data.url + "/#/" + (data.full ? "full" : "profile") + "/" + p._id;

                var cookies = [
                    pdfService.getCookie(data.hostname, "token", full.token),
                    pdfService.getCookie(data.hostname, "Graphs", data.Graphs),
                    pdfService.getCookie(data.hostname, "Summary", data.Summary),
                    pdfService.getCookie(data.hostname, "Scale", data.Scale),
                    pdfService.getCookie(data.hostname, "selectedStartDate", data.selectedStartDate),
                    pdfService.getCookie(data.hostname, "selectedEndDate", data.selectedEndDate),
                    pdfService.getCookie(data.hostname, "selectedRange", data.selectedRange),
                    pdfService.getCookie(data.hostname, "fp.o", data.orderBy),
                    pdfService.getCookie(data.hostname, "fp.s", data.show),
                    pdfService.getCookie(data.hostname, "cmp.o", data.orderByComp),
                    pdfService.getCookie(data.hostname, "cmp.s", data.showComp),
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

                var r = render(url, options).pipe(ws);


            });


        })
    }
    catch (ex) {
        reply({err: ex});
        throw ex;
    }

});


queues.getPdfReportingQueue().consume(function(data,reply) {
    console.log(data.id + " reporting pdf started");

    try {
        PropertyService.search(data.user, {_id: data.id}, function (err, properties) {
            UserService.getFullUser(data.user, function (full) {
                var p = properties[0];
                var fileName = p.name.replace(/ /g, "_");

                if (data.type == "multiple") {
                    fileName = "Portfolio"
                }

                fileName += "_Report_" + moment().utc().add(data.timezone, "minute").format("MM_DD_YYYY");

                fileName += ".pdf";

                var options = pdfService.getDefaultOptions();

                var render = phantom(options);

                var url = data.url + "/#/reporting";

                var cookies = [
                    pdfService.getCookie(data.hostname, "token", full.token),
                    pdfService.getCookie(data.hostname, "compIds", data.compIds),
                    pdfService.getCookie(data.hostname, "reportIds", data.reportIds),
                    pdfService.getCookie(data.hostname, "subjectId", data.id),
                    pdfService.getCookie(data.hostname, "type", data.type),
                    pdfService.getCookie(data.hostname, "propertyIds", data.propertyIds),
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

                    console.log(data.id + " pdf reporting ended");
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

                var r = render(url, options).pipe(ws);
            });
        });
    }
    catch (ex) {
        reply({err: ex});
        throw ex;
    }

});

queues.attachQListeners(queues.getPdfProfileQueue(), "Pdf Profile");
queues.attachQListeners(queues.getPdfReportingQueue(), "Pdf Reporting");
