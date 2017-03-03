var _ = require("lodash")
var async = require("async");
var moment = require('moment')
var phantom = require('phantom-render-stream');
var request = require('request')
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var ProgressService = require('../../progress/services/progressService')
var AuditService = require('../../audit/services/auditService')
var organizationService = require('../../organizations/services/organizationService')
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');
var queues = require('../../../config/queues')
var JSONB = require('json-buffer')
var redisService = require('../../utilities/services/redisService')
var error = require('../../../config/error')


module.exports = {
    init: function(Routes) {
        Routes.get('/alliance', function(req, res) {
            res.setHeader('Content-disposition', 'attachment; filename=alliance.csv');
            res.setHeader('Content-type', 'text/csv');
            res.write("Property,Subject/Comp,CompFor,UnitType,Date,Units,Units %,Sqft,Market Rent,Concess. / 12mo,Net Eff. Rent,NER/Sqft,Occupancy %,Traffic,Leases,Address,City,State,ZipCode,Construction,Year Built,Total Units\r\n")

            organizationService.read(function(err, orgs) {
                var allianceid = _.find(orgs, function(x) {return x.subdomain == 'alliance'})._id;

                PropertyService.search(req.user, {limit: 10000, permission: 'PropertyManage', orgid: allianceid, active: true, select: "_id name survey zip active date totalUnits yearBuild address city state zip"}, function(err, props) {
                    async.eachLimit(props, 1, function(prop, callbackp){

                        queueService.getDashboard({
                            user: req.user,
                            params: {id: prop._id},
                            body: {
                                show: {

                                },

                                daterange: {

                                }
                            }
                        }, function(err,dashboard) {
                            var b, t;
                            if (prop.totalUnits && prop.totalUnits > 0 && dashboard.comps.length > 1) {
                                dashboard.comps.forEach(function(c, i) {
                                    for (b in c.survey.bedrooms) {
                                        t = c.survey.bedrooms[b];
                                        res.write(CSVEncode(c.name));
                                        res.write(',' + (i == 0 ? 'Subject' : 'Comp'));
                                        res.write(',' + CSVEncode(prop.name))
                                        res.write(',' + (b == 0 ? 'Studio' : b + ' Bdrs'))
                                        res.write("," + moment(c.survey.date).utcOffset(-480).format("MM/DD/YYYY"));
                                        res.write("," + t.totUnits);
                                        res.write("," + Math.round(t.totUnits / c.survey.totUnits * 100 * 100) / 100);
                                        res.write("," + t.sqft);
                                        res.write("," + t.rent);
                                        res.write("," + t.concessions);
                                        res.write("," + t.ner);
                                        res.write("," + t.nersqft);
                                        res.write("," + Math.round(c.survey.occupancy * 100) / 100);
                                        res.write("," + c.survey.weeklytraffic);
                                        res.write("," + c.survey.weeklyleases);
                                        res.write("," + c.address);
                                        res.write("," + c.city);
                                        res.write("," + c.state);
                                        res.write("," + c.zip);
                                        res.write("," + c.constructionType);
                                        res.write("," + c.yearBuilt);
                                        res.write("," + c.survey.totUnits);
                                        res.write("\r\n")
                                    }



                                })
                            }

                            callbackp();
                        });

                    }, function() {
                        res.end()
                    })

                })

            })



        })

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

                    profiles.forEach(function(c) {
                        var comp = _.find(dashboard.comps, function (x) {
                            return x._id.toString() == c.property._id.toString()
                        });

                        c.orderNumber = 999;

                        if (comp && typeof comp.orderNumber != 'undefined') {
                            c.orderNumber = comp.orderNumber;
                        }
                        c.name = comp.name;
                    });

                    profiles = _.sortByAll(profiles, ['orderNumber','name']);

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
            var message = {
                user: req.user,
                id: req.params.id,
                url : req.basePath,
                timezone : req.query.timezone,
                hostname : req.hostname,
                progressId : req.query.progressId,
                reportIds : req.query.reportIds,
                compIds : req.query.compIds,
                type: req.query.type,
                propertyIds: req.query.propertyIds
            };
            
            queues.getExchange().publish(message,
                {
                    key: settings.PDF_REPORTING_QUEUE,
                    reply: function (data) {
                        console.log("Pdf Reporting Q for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");

                        if (!data.stream) {
                            error.send(new Error(data.err),message);
                            return res.status("200").send("There was an error generating this report. Please contact an administrator");
                        }

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

            //if (!req.query.showFile && req.headers["user-agent"].indexOf(" Edge/") > -1 && !req.headers["getcontentfeatures.dlna.org"]) {
            //    res.setHeader("content-type", "application/pdf");
            //    res.send(null);
            //    return;
            //}


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
                    full : query.full,
                    Graphs : query.Graphs,
                    Totals : query.Totals,
                    Summary : query.Summary,
                    Scale : query.Scale,
                    selectedStartDate : query.selectedStartDate,
                    selectedEndDate : query.selectedEndDate,
                    selectedRange : query.selectedRange,
                    progressId : query.progressId,
                    orderBy : query.orderBy,
                    show : query.show,
                    orderByComp : query.orderByC,
                    showComp : query.showC,
                    showProfile : query.showP,

                };

                queues.getExchange().publish(message,
                    {
                        key: settings.PDF_PROFILE_QUEUE,
                        reply: function (data) {
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