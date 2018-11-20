var settings = require("../../../config/settings")
var bus = require("../../../config/queues")
var queueService = require('../services/queueService');
var async = require("async");
var _ = require("lodash");
var moment = require("moment-timezone")
var error = require('../../../config/error')

bus.handleQuery(settings.HISTORY_COMPARE_REPORT_QUEUE, function(data,reply) {
    let compNER = 0, compNERSqft = 0, compNERunits = 0;

    let tz = "America/Los_Angeles";

    if (data && data.user && data.user.settings && data.user.settings.tz) {
        tz = data.user.settings.tz;
    }

    const offset = moment().tz(tz).utcOffset();
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
                        c.survey = c.survey || {};
                        c.survey.bedrooms = c.survey.bedrooms || {};
                        c.survey.bedrooms["0"] = c.survey.bedrooms["0"] || {};
                        c.survey.bedrooms["1"] = c.survey.bedrooms["1"] || {};
                        c.survey.bedrooms["2"] = c.survey.bedrooms["2"] || {};
                        c.survey.bedrooms["3"] = c.survey.bedrooms["3"] || {};
                        c.survey.bedrooms["4"] = c.survey.bedrooms["4"] || {};
                        c.survey.bedrooms["5"] = c.survey.bedrooms["5"] || {};
                        c.survey.bedrooms["6"] = c.survey.bedrooms["6"] || {};

                        report.push({
                            "isSubject": i === 0,
                            "default": i,
                            name: c.name,
                            address: c.address,
                            phone: c.phone,
                            walkscore: c.walkscore && c.walkscore.walkscore ? c.walkscore.walkscore : 0,
                            transitscore: c.walkscore && c.walkscore.transitscore ? c.walkscore.transitscore : 0,
                            bikescore: c.walkscore && c.walkscore.bikescore ? c.walkscore.bikescore : 0,
                            yearBuilt: c.yearBuilt,
                            constructionType: c.constructionType,
                            owner: c.owner,
                            management: c.management,
                            _id: c._id,
                            sqft: c.survey.sqft,
                            ner: c.survey.ner,
                            rent: c.survey.rent,
                            rentsqft: c.survey.mersqft,
                            nersqft: c.survey.nersqft,
                            runrate: c.survey.runrate,
                            runratesqft: c.survey.runratesqft,
                            totUnits: c.survey.totUnits,
                            date: c.survey.date,
                            occupancy: c.survey.occupancy,
                            leased: c.survey.leased,
                            renewal: c.survey.renewal,
                            atr_percent : c.survey.atr && c.survey.totUnits > 0 ? Math.round(c.survey.atr / c.survey.totUnits * 100 * 10) / 10 : null,
                            tier: c.survey.tier,
                            weeklytraffic: c.survey.weeklytraffic,
                            weeklyleases: c.survey.weeklyleases,
                            concessions: c.survey.concessions,
                            concessionsMonthly: c.survey.concessionsMonthly,
                            concessionsOneTime: c.survey.concessionsOneTime,
                            rent0: c.survey.bedrooms["0"].rent,
                            rent1: c.survey.bedrooms["1"].rent,
                            rent2: c.survey.bedrooms["2"].rent,
                            rent3: c.survey.bedrooms["3"].rent,
                            rent4: c.survey.bedrooms["4"].rent,
                            rent5: c.survey.bedrooms["5"].rent,
                            rent6: c.survey.bedrooms["6"].rent,
                            ner0: c.survey.bedrooms["0"].ner,
                            ner1: c.survey.bedrooms["1"].ner,
                            ner2: c.survey.bedrooms["2"].ner,
                            ner3: c.survey.bedrooms["3"].ner,
                            ner4: c.survey.bedrooms["4"].ner,
                            ner5: c.survey.bedrooms["5"].ner,
                            ner6: c.survey.bedrooms["6"].ner,
                            excluded: !!c.survey.excluded,
                        });

                        if (i > 0 && c.survey && typeof c.survey.totUnits !== "undefined") {
                            compNER += (c.survey.ner * c.survey.totUnits);
                            compNERSqft += (c.survey.sqft * c.survey.totUnits);
                            compNERunits += c.survey.totUnits;
                        }
                    })

                    if (compNERunits > 0) {
                        compNERSqft = compNER/ compNERSqft;
                        compNER = compNER / compNERunits;

                        report.forEach((x) => {
                            if (x.ner) {
                                x.nervscompavg = (x.ner.toFixed(0) - compNER.toFixed(0))/ compNER.toFixed(0) * 100;
                            }
                            if (x.nersqft) {
                                x.nersqftvscompavg = (x.nersqft.toFixed(2) - compNERSqft.toFixed(2))/ compNERSqft.toFixed(2) * 100;
                            }
                        });
                    }
                    callbackp(null, report);
                    report = null;
                } catch (ex) {
                    console.error(ex);
                    callbackp(ex);
                }
            });
        },
        lastweek: function (callbackp) {

            var end = moment().add(-1, "day").startOf('week').add(1, "day").utcOffset(-480);
            var start = moment(end).add(-7, "day")

            //console.log('last week:',start,end);

            const options = {
                nerPlaces: 1,
                skipPoints: true,
                injectFloorplans: false,
                daterange: {
                    start: start.format(),
                    end: end.format(),
                },
                surveyDateStart: start.format(),
                surveyDateEnd: end.format(),
                offset,
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

            const start = moment().subtract(5, "weeks").startOf("week").add(1, "day").utcOffset(-480);
            const end = moment().subtract(4, "weeks").endOf("week").add(1, "day").utcOffset(-480);

            const options = {
                nerPlaces: 1,
                skipPoints: true,
                injectFloorplans: false,
                daterange: {
                    start: start.format(),
                    end: end.format(),
                },
                surveyDateStart: start.format(),
                surveyDateEnd: end.format(),
                offset,
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

            const options = {
                nerPlaces: 1,
                skipPoints: true,
                injectFloorplans: false,
                daterange: {
                    start: start.format(),
                    end: end.format(),
                },
                surveyDateStart: start.format(),
                surveyDateEnd: end.format(),
                offset,
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
        const totalrowComps = {name: "Comp Averages"};

        report.forEach(function (p, i) {
            //if (i > 0) {

            if (typeof p.leased === 'undefined' || p.leased == null) {
                p.leased = "";
            }

            if (typeof p.renewal === 'undefined' || p.renewal == null) {
                p.renewal = "";
            }
            
            if (typeof p.atr_percent === 'undefined' || p.atr_percent == null) {
                p.atr_percent = "";
            }

            if (typeof p.occupancy === 'undefined' || p.occupancy == null) {
                p.occupancy = "";
            }

            if (p.totUnits) {
                calcTotalRow(all, p, totalrow, compNER, compNERSqft);

                if (i > 0) {
                    calcTotalRow(all, p, totalrowComps, compNER, compNERSqft);
                }
            }
        });

        weightedAverageTotalRow(totalrow);
        weightedAverageTotalRow(totalrowComps);

        if (data.options && data.options.orderBy) {
            if (data.options.orderBy === "-default") {
                data.options.orderBy = "default";
            }

            const f = data.options.orderBy.replace("-", "");
            report = _.sortByOrder(report, [f, "name"], [data.options.orderBy[0] !== "-", true]);
        }

        if (data.options && data.options.compAverages) {
            totalrowComps.isSubject = false;
            totalrowComps.nervscompavg = "";
            totalrowComps.nersqftvscompavg = "";
            report.push(totalrowComps);
        }

        totalrow.isSubject = false;
        report.push(totalrow);

        reply({err: err, report: report});

        report = null;
        all = null;
    });
});

var calcTotalRow = function(all, p, totalrow, compNER, compNERSqft) {
    totalrow.count = (totalrow.count || 0) + 1;
    totalrow.totUnits = (totalrow.totUnits || 0) + p.totUnits;

    if (p.occupancy) {
        totalrow.occupancy = (totalrow.occupancy || 0) + (p.occupancy * p.totUnits); // not weighted
        totalrow.occupancyCount = (totalrow.occupancyCount || 0) + p.totUnits; // not weighted
    }

    totalrow.sqft = (totalrow.sqft || 0) + (p.sqft * p.totUnits);
    totalrow.rent = (totalrow.rent || 0) + (p.rent * p.totUnits);
    totalrow.rentsqft = (totalrow.rentsqft || 0) + (p.rentsqft * p.totUnits);

    totalrow.ner = (totalrow.ner || 0) + (p.ner * p.totUnits);
    totalrow.nersqft = (totalrow.nersqft || 0) + (p.nersqft * p.totUnits);

    totalrow.runrate = (totalrow.runrate || 0) + (p.runrate * p.totUnits);
    totalrow.runratesqft = (totalrow.runratesqft || 0) + (p.runratesqft * p.totUnits);

    totalrow.concessions = (totalrow.concessions || 0) + (p.concessions * p.totUnits);
    totalrow.weeklytraffic = (totalrow.weeklytraffic || 0) + (p.weeklytraffic * p.totUnits);
    totalrow.weeklyleases = (totalrow.weeklyleases || 0) + (p.weeklyleases * p.totUnits);

    totalrow.nervscompavg = compNER;
    totalrow.nersqftvscompavg = compNERSqft;
    
    if (typeof p.rent0 !== "undefined") {
        totalrow.rent0 = (totalrow.rent0 || 0) + (p.rent0 * p.totUnits);
        totalrow.rent0Units = (totalrow.rent0Units || 0) + p.totUnits;
    }
    
    if (typeof p.rent1 !== "undefined") {
        totalrow.rent1 = (totalrow.rent1 || 0) + (p.rent1 * p.totUnits);
        totalrow.rent1Units = (totalrow.rent1Units || 0) + p.totUnits;
    }

    if (typeof p.rent2 !== "undefined") {
        totalrow.rent2 = (totalrow.rent2 || 0) + (p.rent2 * p.totUnits);
        totalrow.rent2Units = (totalrow.rent2Units || 0) + p.totUnits;
    }

    if (typeof p.rent3 !== "undefined") {
        totalrow.rent3 = (totalrow.rent3 || 0) + (p.rent3 * p.totUnits);
        totalrow.rent3Units = (totalrow.rent3Units || 0) + p.totUnits;
    }

    if (typeof p.rent4 !== "undefined") {
        totalrow.rent4 = (totalrow.rent4 || 0) + (p.rent4 * p.totUnits);
        totalrow.rent4Units = (totalrow.rent4Units || 0) + p.totUnits;
    }

    if (typeof p.rent5 !== "undefined") {
        totalrow.rent5 = (totalrow.rent5 || 0) + (p.rent5 * p.totUnits);
        totalrow.rent5Units = (totalrow.rent5Units || 0) + p.totUnits;
    }

    if (typeof p.rent6 !== "undefined") {
        totalrow.rent6 = (totalrow.rent6 || 0) + (p.rent6 * p.totUnits);
        totalrow.rent6Units = (totalrow.rent6Units || 0) + p.totUnits;
    }
    if (typeof p.ner0 !== "undefined") {
        totalrow.ner0 = (totalrow.ner0 || 0) + (p.ner0 * p.totUnits);
        totalrow.ner0Units = (totalrow.ner0Units || 0) + p.totUnits;
    }

    if (typeof p.ner1 !== "undefined") {
        totalrow.ner1 = (totalrow.ner1 || 0) + (p.ner1 * p.totUnits);
        totalrow.ner1Units = (totalrow.ner1Units || 0) + p.totUnits;
    }

    if (typeof p.ner2 !== "undefined") {
        totalrow.ner2 = (totalrow.ner2 || 0) + (p.ner2 * p.totUnits);
        totalrow.ner2Units = (totalrow.ner2Units || 0) + p.totUnits;
    }

    if (typeof p.ner3 !== "undefined") {
        totalrow.ner3 = (totalrow.ner3 || 0) + (p.ner3 * p.totUnits);
        totalrow.ner3Units = (totalrow.ner3Units || 0) + p.totUnits;
    }

    if (typeof p.ner4 !== "undefined") {
        totalrow.ner4 = (totalrow.ner4 || 0) + (p.ner4 * p.totUnits);
        totalrow.ner4Units = (totalrow.ner4Units || 0) + p.totUnits;
    }

    if (typeof p.ner5 !== "undefined") {
        totalrow.ner5 = (totalrow.ner5 || 0) + (p.ner5 * p.totUnits);
        totalrow.ner5Units = (totalrow.ner5Units || 0) + p.totUnits;
    }

    if (typeof p.ner6 !== "undefined") {
        totalrow.ner6 = (totalrow.ner6 || 0) + (p.ner6 * p.totUnits);
        totalrow.ner6Units = (totalrow.ner6Units || 0) + p.totUnits;
    }

    if (typeof p.concessionsMonthly !== "undefined") {
        totalrow.concessionsMonthly = (totalrow.concessionsMonthly || 0) + (p.concessionsMonthly * p.totUnits);
        totalrow.concessionsMonthlyUnits = (totalrow.concessionsMonthlyUnits || 0) + p.totUnits;
    }

    if (typeof p.concessionsOneTime !== "undefined") {
        totalrow.concessionsOneTime = (totalrow.concessionsOneTime || 0) + (p.concessionsOneTime * p.totUnits);
        totalrow.concessionsOneTimeUnits = (totalrow.concessionsOneTimeUnits || 0) + p.totUnits;
    }
    
    if (p.leased !== '') {
        // not weighted
        totalrow.leased = (totalrow.leased || 0) + (p.leased * p.totUnits);
        totalrow.leasedUnits = (totalrow.leasedUnits || 0) + p.totUnits;
    }

    if (p.renewal !== '') {
        // not weighted
        totalrow.renewal = (totalrow.renewal || 0) + (p.renewal * p.totUnits);
        totalrow.renewalUnits = (totalrow.renewalUnits || 0) + p.totUnits;
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
    if (p.ner && lastweek && lastweek.ner) {
        p.lastweeknerpercent = Math.round((p.ner - lastweek.ner) / lastweek.ner * 100 * 10) / 10;

        totalrow.lastweeknerpercent = (totalrow.lastweeknerpercent || 0) + (p.lastweeknerpercent * p.totUnits);
        totalrow.lastweeknerTotalUnits = (totalrow.lastweeknerTotalUnits || 0) + p.totUnits;
    }

    if (p.ner && lastmonth && lastmonth.ner) {
        p.lastmonthnerpercent = Math.round((p.ner - lastmonth.ner) / lastmonth.ner * 100 * 10) / 10;

        totalrow.lastmonthnerpercent = (totalrow.lastmonthnerpercent || 0) + (p.lastmonthnerpercent * p.totUnits);
        totalrow.lastmonthnerTotalUnits = (totalrow.lastmonthnerTotalUnits || 0) + p.totUnits;
    }

    if (p.ner && lastyear && lastyear.ner) {
        p.lastyearnerpercent = Math.round((p.ner - lastyear.ner) / lastyear.ner * 100 * 10) / 10;

        totalrow.lastyearnerpercent = (totalrow.lastyearnerpercent || 0) + (p.lastyearnerpercent * p.totUnits);
        totalrow.lastyearnerTotalUnits = (totalrow.lastyearnerTotalUnits || 0) + p.totUnits;
    }
}

var weightedAverageTotalRow = function(totalrow) {
    if (totalrow.leasedUnits && totalrow.leasedUnits > 0) {
        totalrow.leased = Math.round(totalrow.leased / totalrow.leasedUnits * 10) / 10;
    } else {
        totalrow.leased = "";
    }
    if (totalrow.renewalUnits && totalrow.renewalUnits > 0) {
        totalrow.renewal = Math.round(totalrow.renewal / totalrow.renewalUnits * 10) / 10;
    } else {
        totalrow.renewal = "";
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
        totalrow.rentsqft = Math.round(totalrow.rent / totalrow.sqft * 100) / 100;
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

        if (totalrow.lastweeknerTotalUnits) {
            totalrow.lastweeknerpercent = Math.round(totalrow.lastweeknerpercent / totalrow.lastweeknerTotalUnits * 10) / 10;
        }

        if (totalrow.lastmonthnerTotalUnits) {
            totalrow.lastmonthnerpercent = Math.round(totalrow.lastmonthnerpercent / totalrow.lastmonthnerTotalUnits * 10) / 10;
        }

        if (totalrow.lastyearnerTotalUnits) {
            totalrow.lastyearnerpercent = Math.round(totalrow.lastyearnerpercent / totalrow.lastyearnerTotalUnits * 10) / 10;
        }

        if (totalrow.rent0Units) {
            totalrow.rent0 = Math.round(totalrow.rent0 / totalrow.rent0Units * 100) / 100;
        }
        if (totalrow.rent1Units) {
            totalrow.rent1 = Math.round(totalrow.rent1 / totalrow.rent1Units * 100) / 100;
        }
        if (totalrow.rent2Units) {
            totalrow.rent2 = Math.round(totalrow.rent2 / totalrow.rent2Units * 100) / 100;
        }
        if (totalrow.rent3Units) {
            totalrow.rent3 = Math.round(totalrow.rent3 / totalrow.rent3Units * 100) / 100;
        }
        if (totalrow.rent4Units) {
            totalrow.rent4 = Math.round(totalrow.rent4 / totalrow.rent4Units * 100) / 100;
        }
        if (totalrow.rent5Units) {
            totalrow.rent5 = Math.round(totalrow.rent5 / totalrow.rent5Units * 100) / 100;
        }
        if (totalrow.rent6Units) {
            totalrow.rent6 = Math.round(totalrow.rent6 / totalrow.rent6Units * 100) / 100;
        }

        if (totalrow.ner0Units) {
            totalrow.ner0 = Math.round(totalrow.ner0 / totalrow.ner0Units * 100) / 100;
        }
        if (totalrow.ner1Units) {
            totalrow.ner1 = Math.round(totalrow.ner1 / totalrow.ner1Units * 100) / 100;
            console.log(totalrow.ner1);
        }
        if (totalrow.ner2Units) {
            totalrow.ner2 = Math.round(totalrow.ner2 / totalrow.ner2Units * 100) / 100;
        }
        if (totalrow.ner3Units) {
            totalrow.ner3 = Math.round(totalrow.ner3 / totalrow.ner3Units * 100) / 100;
        }
        if (totalrow.ner4Units) {
            totalrow.ner4 = Math.round(totalrow.ner4 / totalrow.ner4Units * 100) / 100;
        }
        if (totalrow.ner5Units) {
            totalrow.ner5 = Math.round(totalrow.ner5 / totalrow.ner5Units * 100) / 100;
        }
        if (totalrow.ner6Units) {
            totalrow.ner6 = Math.round(totalrow.ner6 / totalrow.ner6Units * 100) / 100;
        }
        if (totalrow.concessionsMonthlyUnits) {
            totalrow.concessionsMonthly = Math.round(totalrow.concessionsMonthly / totalrow.concessionsMonthlyUnits * 100) / 100;
        }
        if (totalrow.concessionsOneTimeUnits) {
            totalrow.concessionsOneTime = Math.round(totalrow.concessionsOneTime / totalrow.concessionsOneTimeUnits * 100) / 100;
        }
        
        totalrow.totUnits = Math.round(totalrow.totUnits / totalrow.count * 10) / 10; // not weighted
    }
}

