var queues = require("../../../config/queues")
var queueService = require('../services/queueService');
var async = require("async");
var _ = require("lodash");

queues.getHistoryCompareReportQueue().consume(function(data,reply) {
    console.log(data.id + " history compare started");

    async.parallel({
        current: function(callbackp) {

            var options = {skipPoints: true, injectFloorplans: false};
            var req = {user : data.user,params : {id: data.id}, body: options}

            queueService.getDashboard(req, function(err,dashboard) {
                console.log(data.id + " history compare ended");

                var report = [];

                dashboard.comps.forEach(function(c) {
                    report.push({name: c.name, _id: c._id, ner: c.survey.ner, rent: c.survey.rent, nersqft: c.survey.nersqft, totUnits: c.survey.totUnits, date: c.survey.date, occupancy: c.survey.occupancy, tier: c.survey.tier});
                })

                callbackp(null, report);

            });
        },
        lastweek: function(callbackp) {

            var d = new Date();
            d.setDate(d.getDate()-7);

            var options = {skipPoints: true, injectFloorplans: false, surveyDate: d };
            var req = {user : data.user,params : {id: data.id}, body: options}

            queueService.getDashboard(req, function(err,dashboard) {
                console.log(data.id + " history compare ended");

                var report = [];

                dashboard.comps.forEach(function(c) {
                    report.push({name: c.name, _id: c._id, ner: c.survey.ner, rent: c.survey.rent, nersqft: c.survey.nersqft, totUnits: c.survey.totUnits, date: c.survey.date, occupancy: c.survey.occupancy, tier: c.survey.tier});
                })

                callbackp(null, report);

            });
        }
        ,
        lastmonth: function(callbackp) {

            var d = new Date();
            d.setDate(d.getDate() - 30);

            var options = {skipPoints: true, injectFloorplans: false, surveyDate: d};
            var req = {user: data.user, params: {id: data.id}, body: options}

            queueService.getDashboard(req, function (err, dashboard) {
                console.log(data.id + " history compare ended");

                var report = [];

                dashboard.comps.forEach(function (c) {
                    report.push({name: c.name, _id: c._id, ner: c.survey.ner, rent: c.survey.rent, nersqft: c.survey.nersqft, totUnits: c.survey.totUnits, date: c.survey.date, occupancy: c.survey.occupancy, tier: c.survey.tier});
                })

                callbackp(null, report);

            });
        }
    }, function(err, all) {

        var report = all.current;

        report.forEach(function(p) {
            var lastweek = _.find(all.lastweek, function(x) {return x._id.toString() == p._id.toString()});
            var lastmonth = _.find(all.lastmonth, function(x) {return x._id.toString() == p._id.toString()});

            if (p.nersqft && lastweek && lastweek.nersqft) {
                p.lastweeknersqft = lastweek.nersqft;
                p.lastweeknersqftpercent = Math.round((p.nersqft - lastweek.nersqft) / p.nersqft * 100 * 10) / 10;
            }

            if (p.nersqft && lastmonth && lastmonth.nersqft) {
                p.lastmonthnersqft = lastmonth.nersqft;
                p.lastmonthnersqftpercent = Math.round((p.nersqft - lastmonth.nersqft) / p.nersqft * 100 * 10) / 10;
            }

        })

        reply({err: err, report: report});
    })


});

queues.attachQListeners(queues.getHistoryCompareReportQueue(), "History Compare");


