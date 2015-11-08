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
    PropertyService.search(data.user, {_id: data.id}, function(err, properties) {
        UserService.getFullUser(data.user, function(full) {
            moment().utcOffset(data.timezone);

            var p = properties[0];
            var fileName = p.name.replace(/ /g, "_");

            if (data.full == "true") {
                fileName += '_and_Comps';
            }

            fileName += "_" + moment().format("MM_DD_YYYY");

            fileName += ".pdf";

            var options = pdfService.getDefaultOptions()

            var render = phantom(options);

            var url = data.url + "/#/" + (data.full == "true" ? "full" : "profile") + "/" + p._id;

            var cookies = [
                pdfService.getCookie(data.hostname,"token", full.token),
                pdfService.getCookie(data.hostname,"Graphs", data.Graphs),
                pdfService.getCookie(data.hostname,"selectedStartDate", data.selectedStartDate),
                pdfService.getCookie(data.hostname,"selectedEndDate", data.selectedEndDate),
                pdfService.getCookie(data.hostname,"selectedRange", data.selectedRange),
                pdfService.getCookie(data.hostname,"fp.o", data.orderBy),
                pdfService.getCookie(data.hostname,"fp.s", data.show),
                pdfService.getCookie(data.hostname,"cmp.o", data.orderByComp),
                pdfService.getCookie(data.hostname,"cmp.s", data.showComp),

            ];


            var description = p.name;

            if (data.full == "true") {
                description += ' (with Comps)';
            }

            description += " - " + data.selectedRange;

            AuditService.create({type: 'pdf_profile', operator: data.user, property: p, description: description, context: data.context})


            options.cookies = cookies;

            var MemoryStream = require('memory-stream');

            var ws = new MemoryStream();


            ws.on('finish', function() {
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

                settings.PDF_HIT_COUNT ++;;
            });

            var r = render(url, options).pipe(ws);


        });




    })    

});


queues.getPdfReportingQueue().consume(function(data,reply) {
    console.log(data.id + " reporting pdf started");

    PropertyService.search(data.user, {_id: data.id}, function(err, properties) {
        UserService.getFullUser(data.user, function (full) {
            moment().utcOffset(data.timezone);
            var p = properties[0];
            var fileName = p.name.replace(/ /g, "_");

            fileName += "_Report" + moment().format("MM_DD_YYYY");

            fileName += ".pdf";

            var options = pdfService.getDefaultOptions();

            var render = phantom(options);

            var url = data.url + "/#/reporting";

            var cookies = [
                pdfService.getCookie(data.hostname,"token", full.token),
                pdfService.getCookie(data.hostname,"compIds", data.compIds),
                pdfService.getCookie(data.hostname,"reportIds", data.reportIds),
                pdfService.getCookie(data.hostname,"subjectId", data.id),
            ];

            options.cookies = cookies;

            var MemoryStream = require('memory-stream');

            var ws = new MemoryStream();


            ws.on('finish', function() {
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
                settings.PDF_HIT_COUNT ++;;
            });

            var r = render(url, options).pipe(ws);
        });
    });


});
