var settings = require("../../../config/settings")
var bus = require("../../../config/queues")
var queueService = require('../services/queueService');
var async = require("async");
var _ = require("lodash");
var moment = require("moment")
var error = require('../../../config/error')

bus.handleQuery(settings.HISTORY_COMPARE_REPORT_QUEUE, function(data,reply) {
    var compNER = 0, compNERunits = 0;
    async.parallel({
        current: function (callbackp) {

            var options = {nerPlaces: 1, skipPoints: true, injectFloorplans: false};
            var req = {user: data.user, params: {id: data.id}, body: options}

            queueService.getDashboard(req, function (err, dashboard) {

                if (!dashboard || dashboard == null) {
                    error.send("Null dashboard in notifications / current", {where: 'current', err: err, dashboard: dashboard, data: data, user: data.user});
                }
                console.log(data.id + " history compare ended");

                var report = [];

                try {
                    dashboard.comps.forEach(function (c, i) {

                        report.push({
                            name: c.name,
                            _id: c._id,
                            sqft: c.survey.sqft,
                            ner: c.survey.ner,
                            rent: c.survey.rent,
                            nersqft: c.survey.nersqft,
                            runrate: c.survey.runrate,
                            runratesqft: c.survey.runratesqft,
                            totUnits: c.survey.totUnits,
                            date: c.survey.date,
                            occupancy: c.survey.occupancy,
                            leased: c.survey.leased,
                            atr_percent : c.survey.atr && c.survey.totUnits > 0 ? Math.round(c.survey.atr / c.survey.totUnits * 100 * 10) / 10 : null,
                            tier: c.survey.tier,
                            weeklytraffic: c.survey.weeklytraffic,
                            weeklyleases: c.survey.weeklyleases,
                            concessions: c.survey.concessions,
                        });

                        if (i > 0 && c.survey) {
                            compNER += (c.survey.ner * c.survey.totUnits);
                            compNERunits += c.survey.totUnits;
                        }
                    })

                    if (compNERunits > 0) {
                        compNER = compNER /  compNERunits;

                        report.forEach(x=> {
                            if (x.ner) {
                                x.nervscompavg = (x.ner.toFixed(0) - compNER.toFixed(0))/ compNER.toFixed(0) * 100;
                            }
                        })
                    }
                    callbackp(null, report);
                    report = null;
                } catch (ex) {
                    callbackp(ex);
                }
            });
        },
        lastweek: function (callbackp) {

            var end = moment().add(-1, "day").startOf('week').add(1, "day").utcOffset(-480);
            var start = moment(end).add(-7, "day")

            //console.log('last week:',start,end);

            var options = {
                nerPlaces: 1,
                skipPoints: true,
                injectFloorplans: false,
                surveyDateStart: start.format(),
                surveyDateEnd: end.format()
            };

            var req = {user: data.user, params: {id: data.id}, body: options}

            queueService.getDashboard(req, function (err, dashboard) {

                if (!dashboard || dashboard == null) {
                    error.send("Null dashboard in notifications / lastweek", {where: 'lastweek', err: err, dashboard: dashboard, data: data, user: data.user});
                }

                //console.log(data.id + " history compare ended");

                var report = [];

                try {
                    dashboard.comps.forEach(function (c) {
                        report.push({
                            name: c.name,
                            _id: c._id,
                            sqft: c.survey.sqft,
                            ner: c.survey.ner,
                            rent: c.survey.rent,
                            runrate: c.survey.runrate,
                            runratesqft: c.survey.runratesqft,
                            nersqft: c.survey.nersqft,
                            totUnits: c.survey.totUnits,
                            date: c.survey.date,
                            occupancy: c.survey.occupancy,
                            leased: c.survey.leased,
                            atr_percent : c.survey.atr && c.survey.totUnits > 0 ? Math.round(c.survey.atr / c.survey.totUnits * 100 * 10) / 10 : null,
                            tier: c.survey.tier
                        });
                    })

                    callbackp(null, report);
                    report = null;
                } catch (ex) {
                    callbackp(ex);
                }

            });
        }
        ,
        lastmonth: function (callbackp) {

            //var end = moment().add(-1,"month").endOf('month').utcOffset(-480);
            //var start = moment().add(-1,"month").startOf('month').utcOffset(-480);

            var start = moment().subtract(5, "weeks").startOf("week").add(1, "day").utcOffset(-480);
            var end = moment().subtract(4, "weeks").endOf("week").add(1, "day").utcOffset(-480);


            var options = {
                nerPlaces: 1,
                skipPoints: true,
                injectFloorplans: false,
                surveyDateStart: start.format(),
                surveyDateEnd: end.format()
            };
            var req = {user: data.user, params: {id: data.id}, body: options}

            queueService.getDashboard(req, function (err, dashboard) {
                //console.log(data.id + " history compare ended");

                if (!dashboard || dashboard == null) {
                    error.send("Null dashboard in notifications / lastmonth", {where: 'lastmonth', err: err, dashboard: dashboard, data: data, user: data.user});
                }

                var report = [];

                try {
                    dashboard.comps.forEach(function (c) {
                        report.push({
                            name: c.name,
                            _id: c._id,
                            sqft: c.survey.sqft,
                            ner: c.survey.ner,
                            rent: c.survey.rent,
                            runrate: c.survey.runrate,
                            runratesqft: c.survey.runratesqft,
                            nersqft: c.survey.nersqft,
                            totUnits: c.survey.totUnits,
                            date: c.survey.date,
                            occupancy: c.survey.occupancy,
                            leased: c.survey.leased,
                            atr_percent : c.survey.atr && c.survey.totUnits > 0 ? Math.round(c.survey.atr / c.survey.totUnits * 100 * 10) / 10 : null,
                            tier: c.survey.tier
                        });
                    })

                    callbackp(null, report);
                    report = null;
                } catch (ex) {
                    callbackp(ex);
                }

            });
        }
        ,
        lastyear: function (callbackp) {

            //var end = moment().add(-1,"month").endOf('month').utcOffset(-480);
            //var start = moment().add(-1,"month").startOf('month').utcOffset(-480);

            var start = moment().subtract(56, "weeks").startOf("week").add(1, "day").utcOffset(-480);
            var end = moment().subtract(52, "weeks").endOf("week").add(1, "day").utcOffset(-480);


            var options = {
                nerPlaces: 1,
                skipPoints: true,
                injectFloorplans: false,
                surveyDateStart: start.format(),
                surveyDateEnd: end.format()
            };
            var req = {user: data.user, params: {id: data.id}, body: options}

            queueService.getDashboard(req, function (err, dashboard) {

                //console.log(dashboard.comps);
                //console.log(data.id + " history compare ended");

                if (!dashboard || dashboard == null) {
                    error.send("Null dashboard in notifications / lastyear", {where: 'lastyear', err: err, dashboard: dashboard, data: data, user: data.user});
                }

                var report = [];

                try {
                    dashboard.comps.forEach(function (c) {
                        report.push({
                            name: c.name,
                            _id: c._id,
                            sqft: c.survey.sqft,
                            ner: c.survey.ner,
                            rent: c.survey.rent,
                            runrate: c.survey.runrate,
                            runratesqft: c.survey.runratesqft,
                            nersqft: c.survey.nersqft,
                            totUnits: c.survey.totUnits,
                            date: c.survey.date,
                            occupancy: c.survey.occupancy,
                            leased: c.survey.leased,
                            atr_percent : c.survey.atr && c.survey.totUnits > 0 ? c.survey.atr / c.survey.totUnits * 100 : null,
                            tier: c.survey.tier
                        });
                    })

                    callbackp(null, report);
                    report = null;
                } catch (ex) {
                    callbackp(ex);
                }

            });
        }
    }, function (err, all) {

        if (err) {
            error.send(err, {data: data, user: data.user});
            reply({err: err, report: null});
            return
        }

        var report = all.current;

        var totalrow = {name: 'Averages'};

        report.forEach(function (p, i) {
            //if (i > 0) {

            if (typeof p.leased === 'undefined' || p.leased == null) {
                p.leased = "";
            }

            if (typeof p.atr_percent === 'undefined' || p.atr_percent == null) {
                p.atr_percent = "";
            }

            if (typeof p.occupancy === 'undefined' || p.occupancy == null) {
                p.occupancy = "";
            }

            if (p.totUnits) {
                totalrow.count = (totalrow.count || 0) + 1;
                totalrow.totUnits = (totalrow.totUnits || 0) + p.totUnits;

                if (p.occupancy) {
                    totalrow.occupancy = (totalrow.occupancy || 0) + (p.occupancy * p.totUnits); // not weighted
                    totalrow.occupancyCount = (totalrow.occupancyCount || 0) + p.totUnits; // not weighted
                }

                totalrow.sqft = (totalrow.sqft || 0) + (p.sqft * p.totUnits);
                totalrow.rent = (totalrow.rent || 0) + (p.rent * p.totUnits);
                totalrow.ner = (totalrow.ner || 0) + (p.ner * p.totUnits);
                totalrow.nersqft = (totalrow.nersqft || 0) + (p.nersqft * p.totUnits);

                totalrow.runrate = (totalrow.runrate || 0) + (p.runrate * p.totUnits);
                totalrow.runratesqft = (totalrow.runratesqft || 0) + (p.runratesqft * p.totUnits);

                totalrow.concessions = (totalrow.concessions || 0) + (p.concessions * p.totUnits);
                totalrow.weeklytraffic = (totalrow.weeklytraffic || 0) + (p.weeklytraffic * p.totUnits);
                totalrow.weeklyleases = (totalrow.weeklyleases || 0) + (p.weeklyleases * p.totUnits);

                totalrow.nervscompavg = compNER;

                if (p.leased !== '') {
                    // not weighted
                    totalrow.leased = (totalrow.leased || 0) + (p.leased * p.totUnits);
                    totalrow.leasedUnits = (totalrow.leasedUnits || 0) + p.totUnits;
                }

                if (p.atr_percent !== '') {
                    // not weighted
                    totalrow.atr_percent = (totalrow.atr_percent || 0) + (p.atr_percent * p.totUnits);
                    totalrow.atrUnits = (totalrow.atrUnits || 0) + p.totUnits;
                }
                //}

                var lastweek = _.find(all.lastweek, function (x) {
                    return x._id.toString() == p._id.toString()
                });
                var lastmonth = _.find(all.lastmonth, function (x) {
                    return x._id.toString() == p._id.toString()
                });
                var lastyear = _.find(all.lastyear, function (x) {
                    return x._id.toString() == p._id.toString()
                });


                if (p.nersqft && lastweek && lastweek.nersqft) {
                    p.lastweeknersqftpercent = Math.round((p.nersqft - lastweek.nersqft) / lastweek.nersqft * 100 * 10) / 10;

                    totalrow.lastweeknersqftpercent = (totalrow.lastweeknersqftpercent || 0) + (p.lastweeknersqftpercent * p.totUnits);
                    totalrow.lastweeknersqftTotalUnits = (totalrow.lastweeknersqftTotalUnits || 0) + p.totUnits;
                }

                if (p.nersqft && lastmonth && lastmonth.nersqft) {
                    p.lastmonthnersqftpercent = Math.round((p.nersqft - lastmonth.nersqft) / lastmonth.nersqft * 100 * 10) / 10;

                    totalrow.lastmonthnersqftpercent = (totalrow.lastmonthnersqftpercent || 0) + (p.lastmonthnersqftpercent * p.totUnits);
                    totalrow.lastmonthnersqftTotalUnits = (totalrow.lastmonthnersqftTotalUnits || 0) + p.totUnits;
                }

                if (p.nersqft && lastyear && lastyear.nersqft) {
                    p.lastyearnersqftpercent = Math.round((p.nersqft - lastyear.nersqft) / lastyear.nersqft * 100 * 10) / 10;

                    totalrow.lastyearnersqftpercent = (totalrow.lastyearnersqftpercent || 0) + (p.lastyearnersqftpercent * p.totUnits);
                    totalrow.lastyearnersqftTotalUnits = (totalrow.lastyearnersqftTotalUnits || 0) + p.totUnits;
                }
            }

        })

        if (totalrow.leasedUnits && totalrow.leasedUnits > 0) {
            totalrow.leased = Math.round(totalrow.leased / totalrow.leasedUnits * 10) / 10;
        } else {
            totalrow.leased = "";
        }

        if (totalrow.atrUnits && totalrow.atrUnits > 0) {
            totalrow.atr_percent = Math.round(totalrow.atr_percent / totalrow.atrUnits * 10) / 10;
        } else {
            totalrow.atr_percent = "";
        }

        if (totalrow.totUnits && totalrow.totUnits > 0) {

            if (totalrow.occupancyCount) {
                totalrow.occupancy = Math.round(totalrow.occupancy / totalrow.occupancyCount * 10) / 10; // not weighted
            }
            totalrow.sqft = Math.round(totalrow.sqft / totalrow.totUnits);
            totalrow.rent = Math.round(totalrow.rent / totalrow.totUnits);
            totalrow.ner = Math.round(totalrow.ner / totalrow.totUnits);
            totalrow.nersqft = Math.round(totalrow.ner / totalrow.sqft * 100) / 100;
            totalrow.runrate = Math.round(totalrow.runrate / totalrow.totUnits);
            totalrow.runratesqft = Math.round(totalrow.runrate / totalrow.sqft * 100) / 100;

            totalrow.concessions = Math.round(totalrow.concessions / totalrow.totUnits);
            totalrow.weeklytraffic = Math.round(totalrow.weeklytraffic / totalrow.totUnits);
            totalrow.weeklyleases = Math.round(totalrow.weeklyleases / totalrow.totUnits);

            if (totalrow.lastweeknersqftTotalUnits) {
                totalrow.lastweeknersqftpercent = Math.round(totalrow.lastweeknersqftpercent / totalrow.lastweeknersqftTotalUnits * 10) / 10;
            }

            if (totalrow.lastmonthnersqftTotalUnits) {
                totalrow.lastmonthnersqftpercent = Math.round(totalrow.lastmonthnersqftpercent / totalrow.lastmonthnersqftTotalUnits * 10) / 10;
            }

            if (totalrow.lastyearnersqftTotalUnits) {
                totalrow.lastyearnersqftpercent = Math.round(totalrow.lastyearnersqftpercent / totalrow.lastyearnersqftTotalUnits * 10) / 10;
            }

            totalrow.totUnits = Math.round(totalrow.totUnits / totalrow.count * 10) / 10; // not weighted
        }

        report.push(totalrow);

        reply({err: err, report: report});

        report = null;
        all = null;
    })
});



