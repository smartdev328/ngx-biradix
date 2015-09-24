var queues = require("../../../config/queues")
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
            ];

            var description = p.name;

            if (data.full == "true") {
                description += ' (with Comps)';
            }

            description += " - " + data.selectedRange;

            AuditService.create({type: 'pdf_profile', operator: data.user, property: p, description: description, context: data.context})


            options.cookies = cookies;

            var stream = require('stream');
            var converter = new stream.Writable();
            converter._write = function (chunk) {

                if (data.progressId) {
                    ProgressService.setComplete(data.progressId)
                }

                var JSONB = require('json-buffer')

                console.log(data.id + " pdf ended");
                reply({stream: JSONB.stringify(chunk), filename: fileName});
                full = null;
                cookies = null;
                r = null;
                render = null;
                options = null;
                properties = null;
            };

            var r = render(url, options).pipe(converter);

        });




    })    

});
