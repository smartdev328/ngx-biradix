var queues = require("../../../config/queues")
var queueService = require('../services/queueService');
var async = require("async");
var _ = require("lodash");
var moment = require("moment")

queues.getHistoryCompareReportQueue().consume(function(data,reply) {
    async.parallel({
        current: function(callbackp) {

            var options = {skipPoints: true, injectFloorplans: false};
            var req = {user : data.user,params : {id: data.id}, body: options}

            queueService.getDashboard(req, function(err,dashboard) {
                //console.log(data.id + " history compare ended");

                var report = [];

                dashboard.comps.forEach(function(c) {
                    report.push({name: c.name, _id: c._id, sqft: c.survey.sqft, ner: c.survey.ner, rent: c.survey.rent, nersqft: c.survey.nersqft, totUnits: c.survey.totUnits, date: c.survey.date, occupancy: c.survey.occupancy, leased: c.survey.leased, tier: c.survey.tier});
                })


                callbackp(null, report);
                report = null;


            });
        },
        lastweek: function(callbackp) {

            var end = moment().add(-1,"day").startOf('week').add(1,"day").utcOffset(-480);
            var start = moment(end).add(-7,"day")

            //console.log('last week:',start,end);

            var options = {skipPoints: true, injectFloorplans: false, surveyDateStart: start.format(), surveyDateEnd: end.format() };
            var req = {user : data.user,params : {id: data.id}, body: options}

            queueService.getDashboard(req, function(err,dashboard) {
                //console.log(data.id + " history compare ended");

                var report = [];

                dashboard.comps.forEach(function(c) {
                    report.push({name: c.name, _id: c._id, sqft: c.survey.sqft, ner: c.survey.ner, rent: c.survey.rent, nersqft: c.survey.nersqft, totUnits: c.survey.totUnits, date: c.survey.date, occupancy: c.survey.occupancy, leased: c.survey.leased, tier: c.survey.tier});
                })

                callbackp(null, report);
                report = null;

            });
        }
        ,
        lastmonth: function(callbackp) {

            //var end = moment().add(-1,"month").endOf('month').utcOffset(-480);
            //var start = moment().add(-1,"month").startOf('month').utcOffset(-480);

            var end = moment().subtract(5,"weeks").endOf("week").add(1,"day").utcOffset(-480);
            var start = moment().subtract(5,"weeks").startOf("week").add(1,"day").utcOffset(-480);

            var options = {skipPoints: true, injectFloorplans: false, surveyDateStart: start.format(), surveyDateEnd: end.format()};
            var req = {user: data.user, params: {id: data.id}, body: options}

            queueService.getDashboard(req, function (err, dashboard) {
                //console.log(data.id + " history compare ended");

                var report = [];

                dashboard.comps.forEach(function (c) {
                    report.push({name: c.name, _id: c._id, sqft: c.survey.sqft, ner: c.survey.ner, rent: c.survey.rent, nersqft: c.survey.nersqft, totUnits: c.survey.totUnits, date: c.survey.date, occupancy: c.survey.occupancy, leased: c.survey.leased, tier: c.survey.tier});
                })

                callbackp(null, report);
                report = null;

            });
        }
    }, function(err, all) {

        var report = all.current;

        var totalrow = {name: 'Totals/Averages'};

        report.forEach(function(p,i) {
            //if (i > 0) {

            if (typeof p.leased === 'undefined') {
                p.leased = "";
            }

            if (p.totUnits) {
                totalrow.count = (totalrow.count || 0) + 1;
                totalrow.totUnits = (totalrow.totUnits || 0) + p.totUnits;
                totalrow.occupancy = (totalrow.occupancy || 0) + (p.occupancy * 1); // not weighted
                totalrow.sqft = (totalrow.sqft || 0) + (p.sqft * p.totUnits);
                totalrow.rent = (totalrow.rent || 0) + (p.rent * p.totUnits);
                totalrow.ner = (totalrow.ner || 0) + (p.ner * p.totUnits);
                totalrow.nersqft = (totalrow.nersqft || 0) + (p.nersqft * p.totUnits);

                if (p.leased !== '') {
                    // not weighted
                    totalrow.leased = (totalrow.leased || 0) + (p.leased * 1);
                    totalrow.leasedUnits = (totalrow.leasedUnits || 0) + 1;
                }

                //}

                var lastweek = _.find(all.lastweek, function (x) {
                    return x._id.toString() == p._id.toString()
                });
                var lastmonth = _.find(all.lastmonth, function (x) {
                    return x._id.toString() == p._id.toString()
                });

                if (p.nersqft && lastweek && lastweek.nersqft) {
                    p.lastweeknersqft = lastweek.nersqft;
                    p.lastweeknersqftpercent = Math.round((p.nersqft - lastweek.nersqft) / lastmonth.nersqft * 100 * 10) / 10;

                    totalrow.lastweeknersqft = (totalrow.lastweeknersqft || 0) + (p.lastweeknersqft * p.totUnits);
                    totalrow.lastweeknersqftTotal = (totalrow.lastweeknersqftTotal || 0) + (p.nersqft * p.totUnits);
                    totalrow.lastweeknersqftTotalUnits = (totalrow.lastweeknersqftTotalUnits || 0) + p.totUnits;
                }

                if (p.nersqft && lastmonth && lastmonth.nersqft) {
                    p.lastmonthnersqft = lastmonth.nersqft;
                    p.lastmonthnersqftpercent = Math.round((p.nersqft - lastmonth.nersqft) / lastmonth.nersqft * 100 * 10) / 10;

                    totalrow.lastmonthnersqft = (totalrow.lastmonthnersqft || 0) + (p.lastmonthnersqft * p.totUnits);
                    totalrow.lastmonthnersqftTotal = (totalrow.lastmonthnersqftTotal || 0) + (p.nersqft * p.totUnits);
                    totalrow.lastmonthnersqftTotalUnits = (totalrow.lastmonthnersqftTotalUnits || 0) + p.totUnits;
                }
            }

        })

        if (totalrow.leasedUnits && totalrow.leasedUnits > 0) {
            totalrow.leased = Math.round(totalrow.leased / totalrow.leasedUnits * 10) / 10;
        } else {
            totalrow.leased = "";
        }

        if (totalrow.totUnits && totalrow.totUnits > 0) {

            totalrow.occupancy = Math.round(totalrow.occupancy / totalrow.count * 10) / 10; // not weighted
            totalrow.sqft = Math.round(totalrow.sqft / totalrow.totUnits);
            totalrow.rent = Math.round(totalrow.rent / totalrow.totUnits);
            totalrow.ner = Math.round(totalrow.ner / totalrow.totUnits);
            totalrow.nersqft = Math.round(totalrow.nersqft / totalrow.totUnits * 100) / 100;
            totalrow.lastweeknersqft = Math.round(totalrow.lastweeknersqft / totalrow.lastweeknersqftTotalUnits * 100) / 100;
            totalrow.lastmonthnersqft = Math.round(totalrow.lastmonthnersqft / totalrow.lastmonthnersqftTotalUnits * 100) / 100;
            totalrow.lastweeknersqftTotal = Math.round(totalrow.lastweeknersqftTotal / totalrow.lastweeknersqftTotalUnits * 100) / 100;
            totalrow.lastmonthnersqftTotal = Math.round(totalrow.lastmonthnersqftTotal / totalrow.lastmonthnersqftTotalUnits * 100) / 100;

            if (totalrow.lastweeknersqft) {
                totalrow.lastweeknersqftpercent = Math.round((totalrow.lastweeknersqftTotal - totalrow.lastweeknersqft ) / totalrow.lastweeknersqft * 100 * 10) / 10;
            }

            if (totalrow.lastmonthnersqft) {
                totalrow.lastmonthnersqftpercent = Math.round((totalrow.lastmonthnersqftTotal - totalrow.lastmonthnersqft ) / totalrow.lastmonthnersqft * 100 * 10) / 10;
            }
        }

        //console.log(totalrow)
        report.push(totalrow);

        reply({err: err, report: report});

        report = null;
        all = null;
    })


});

queues.attachQListeners(queues.getHistoryCompareReportQueue(), "History Compare");


