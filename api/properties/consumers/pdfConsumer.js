var bus = require("../../../config/queues")
var settings = require("../../../config/settings")
var PropertyService = require("../services/propertyService")
var pdfService = require("../services/pdfService")
var UserService = require('../../users/services/userService')
var moment = require('moment')
var AuditService = require('../../audit/services/auditService')
var ProgressService = require('../../progress/services/progressService')
var JSONB = require('json-buffer')
var errors = require("../../../config/error")

bus.handleQuery(settings.PDF_PROFILE_QUEUE, function(data,reply) {
    // console.log(data.id + " pdf started");
    try {
        PropertyService.search(data.user, {_id: data.id, skipAmenities: true}, function (err, properties) {
            UserService.getFullUser(data.user, function (full) {
                var p = properties[0];
                var fileName = p.name.replace(/ /g, "_");

                fileName += "_" + moment().utc().add(data.timezone, "minute").format("MM_DD_YYYY");

                fileName += ".pdf";

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

                pdfService.getPdf(data.transaction_id, url, cookies, function(err,buffer) {
                    if (data.progressId) {
                        ProgressService.setComplete(data.progressId)
                    }

                    // console.log(data.id + " pdf ended");

                    if (err) {
                        console.log('I failed render');
                        reply({stream: null, err: err});
                        errors.send(err);
                    }
                    else {
                        reply({stream: JSONB.stringify(buffer), filename: fileName});
                    }
                    full = null;
                    cookies = null;
                    properties = null;
                });
            });
        })
    }
    catch (ex) {
        console.log('I failed render');
        reply({stream: null, err: ex});
    }
});

bus.handleQuery(settings.PDF_REPORTING_QUEUE, function(data,reply) {
    // console.log(data.propertyIds, " reporting pdf started");

    try {
        let propertyId = data.propertyIds.toString().length == 24 ? data.propertyIds : null;

        PropertyService.search(data.user, {_id: propertyId, skipAmenities: true, limit : 1}, function (err, properties) {
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

                var url = data.url + "/#/reporting";
                url = url.replace("https://","http://");

                var cookies = [
                    pdfService.getCookie(data.hostname, "transaction_id", data.transaction_id),
                    pdfService.getCookie(data.hostname, "token", full.token),
                    pdfService.getCookie(data.hostname, "compIds", data.compIds),
                    pdfService.getCookie(data.hostname, "reportIds", data.reportIds),
                    pdfService.getCookie(data.hostname, "type", data.type),
                    pdfService.getCookie(data.hostname, "propertyIds", data.propertyIds),
                    pdfService.getCookie(data.hostname, "settings", encodeURIComponent(JSON.stringify(data.settings))),
                ];

                pdfService.getPdf(data.transaction_id, url, cookies, function(err,buffer) {
                    if (data.progressId) {
                        ProgressService.setComplete(data.progressId);
                    }

                    // console.log(data.propertyIds, " pdf reporting ended");
                    if (err) {
                        console.log('I failed render', err);
                        reply({stream: null, err: err});
                        errors.send(err);
                    }
                    else {
                        reply({stream: JSONB.stringify(buffer), filename: fileName});
                    }
                    full = null;
                    cookies = null;
                    properties = null;
                });
            });
        });
    }
    catch (ex) {
        reply({stream: null, err: ex.toString()});
    }

});

