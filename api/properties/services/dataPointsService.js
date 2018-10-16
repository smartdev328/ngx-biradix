"use strict";
var async = require("async");
var _ = require("lodash")
var moment = require("moment");
var DateService = require("../../utilities/services/dateService")
var DataPointsHelperService = require("./dataPointsHelperService")
var SurveySchema= require("../schemas/surveySchema")
const error = require("../../../config/error");

module.exports = {
    getPoints: function(hide,subject,comps,summary,bedrooms,daterange,offset,show,callback) {
        if (bedrooms == -2) {
            show.bedrooms = true;
        }

        var propertyids = _.pluck(comps,"_id");
        if (!propertyids || propertyids.length == 0) {
            return callback({});
        }

        var query = SurveySchema.find();

        query = query.where("propertyid").in(propertyids);
        var dr = DateService.convertRangeToParts(daterange,offset);

        if (daterange.daterange != "Lifetime") {
            query = query.where("date").gte(dr.start).lte(dr.end);
        }

        var select = "_id date propertyid floorplans.units";

        if (show.occupancy) {
            select += " occupancy"
        }

        if (show.leased) {
            select += " leased"
        }

        if (show.atr) {
            select += " atr_percent"
        }

        if (show.renewal) {
            select += " renewal"
        }
        
        if (show.leases) {
            select += " weeklyleases"
        }

        if (show.traffic) {
            select += " weeklytraffic"
        }

        //if (show.ner || show.rent || show.rentsqft || show.nersqft || show.concessions || show.runrate || show.runratesqft) {
            select += " exclusions floorplans.id floorplans.rent floorplans.concessions floorplans.concessionsMonthly floorplans.concessionsOneTime floorplans.bedrooms floorplans.bathrooms floorplans.sqft";
        //}

        query = query.select(select)

        query = query.sort("date");

        let switchBackNer = false;
        if (show.scale === "nersqft") {
            show.scale = "ner";
            show.nersqft = true;
            switchBackNer = true;
        }

        var timer = new Date().getTime();
        query.exec(function(err, surveys) {
            try {
                // console.log("Downloading " + surveys.length + " surveys for points " + ((new Date().getTime() - timer) / 1000) + "s");
                if (err) {
                    return callback({});
                }

                var bedroomBeakdown = [];

                var points = {};
                var excluded = false;

                if (show.bedrooms) {
                    // if we are doing "All" on dashboard, get bedrooms from subject property
                    var propertyid;
                    if (bedrooms == -2) {
                        propertyid = subject._id.toString()
                    } else {
                        propertyid = comps[0]._id.toString()
                    }

                    var fps = _.flatten(_.map(_.filter(surveys, function (x) {
                        return x.propertyid.toString() == propertyid
                    }), function (x) {
                        return x.floorplans
                    }));

                    var includedFps = _.filter(fps, function (x) {
                        if (x.excluded) {
                            excluded = true;
                        }
                        return !hide || !x.excluded
                    });

                    bedroomBeakdown = _.uniq(_.pluck(includedFps, "bedrooms"));
                }

                var dateKey;
                var nerPoint;
                var prop;
                var newpoints;

                surveys.forEach(function (s) {
                    dateKey = parseInt(moment.utc(s.date).add(offset, "minute").startOf("day").subtract(offset, "minute").format("x"));

                    points[s.propertyid] = points[s.propertyid] || {};

                    if (show.graphs !== true) {
                        points[s.propertyid].surveys = points[s.propertyid].surveys || {};
                        points[s.propertyid].surveys[dateKey] = s._id;
                    }

                    if (show.occupancy) {
                        points[s.propertyid].occupancy = points[s.propertyid].occupancy || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "occupancy");
                        points[s.propertyid].occupancy[dateKey] = nerPoint;
                    }

                    if (show.leased && s.leased != null) {
                        points[s.propertyid].leased = points[s.propertyid].leased || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "leased");
                        points[s.propertyid].leased[dateKey] = nerPoint;
                    }

                    if (show.atr && s.atr_percent != null) {
                        points[s.propertyid].atr = points[s.propertyid].atr || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "atr");
                        points[s.propertyid].atr[dateKey] = nerPoint;
                    }

                    if (show.renewal && s.renewal != null) {
                        points[s.propertyid].renewal = points[s.propertyid].renewal || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "renewal");
                        points[s.propertyid].renewal[dateKey] = nerPoint;
                    }

                    if (show.leases) {
                        points[s.propertyid].leases = points[s.propertyid].leases || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "leases");
                        points[s.propertyid].leases[dateKey] = nerPoint;
                    }

                    if (show.traffic) {
                        points[s.propertyid].traffic = points[s.propertyid].traffic || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "traffic");
                        points[s.propertyid].traffic[dateKey] = nerPoint;
                    }

                    if (show.rent || show.rentsqft) {
                        points[s.propertyid].rent = points[s.propertyid].rent || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "rent");
                        points[s.propertyid].rent[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }
                    }

                    if (show.rentsqft) {
                        points[s.propertyid].rentsqft = points[s.propertyid].rentsqft || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "rentsqft");
                        points[s.propertyid].rentsqft[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }
                    }

                    if (show.runrate || show.runratesqft) {
                        points[s.propertyid].runrate = points[s.propertyid].runrate || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "runrate");
                        points[s.propertyid].runrate[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }
                    }

                    if (show.runratesqft) {
                        points[s.propertyid].runratesqft = points[s.propertyid].runratesqft || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "runratesqft");
                        points[s.propertyid].runratesqft[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }
                    }

                    if (show.nersqft) {
                        points[s.propertyid].nersqft = points[s.propertyid].nersqft || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "nersqft");
                        points[s.propertyid].nersqft[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }
                    }

                    if (show.concessions) {
                        points[s.propertyid].concessions = points[s.propertyid].concessions || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "concessions");
                        points[s.propertyid].concessions[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }

                        points[s.propertyid].concessionsMonthly = points[s.propertyid].concessionsMonthly || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "concessionsMonthly");
                        points[s.propertyid].concessionsMonthly[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }

                        points[s.propertyid].concessionsOneTime = points[s.propertyid].concessionsOneTime || {};
                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "concessionsOneTime");
                        points[s.propertyid].concessionsOneTime[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }
                    }

                    if (show.ner || show.nersqft || show.scale === "nersqft") {
                        points[s.propertyid].ner = points[s.propertyid].ner || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, show.scale);
                        points[s.propertyid].ner[dateKey] = nerPoint;

                        if (nerPoint.excluded) {
                            excluded = true;
                        }

                        bedroomBeakdown.forEach(function (b) {
                            points[s.propertyid][b] = points[s.propertyid][b] || {};
                            points[s.propertyid][b][dateKey] = points[s.propertyid][b][dateKey] || {};
                            nerPoint = DataPointsHelperService.getNerPoint(s, b, hide, subject, comps, show.scale);
                            points[s.propertyid][b][dateKey] = nerPoint;

                            points[s.propertyid][b + "_sqft"] = points[s.propertyid][b + "_sqft"] || {};
                            points[s.propertyid][b + "_sqft"][dateKey] = points[s.propertyid][b + "_sqft"][dateKey] || {};
                            nerPoint = DataPointsHelperService.getNerPoint(s, b, hide, subject, comps, "sqft");
                            points[s.propertyid][b + "_sqft"][dateKey] = nerPoint;

                            points[s.propertyid][b + "_nersqft"] = points[s.propertyid][b + "_nersqft"] || {};
                            points[s.propertyid][b + "_nersqft"][dateKey] = points[s.propertyid][b + "_nersqft"][dateKey] || {};
                            nerPoint = DataPointsHelperService.getNerPoint(s, b, hide, subject, comps, "nersqft");
                            points[s.propertyid][b + "_nersqft"][dateKey] = nerPoint;                            
                        });
                    }

                    if (show.nersqft || show.rentsqft || show.runratesqft || show.scale === "nersqft") {
                        points[s.propertyid].sqft = points[s.propertyid].sqft || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, "sqft");
                        points[s.propertyid].sqft[dateKey] = nerPoint;
                    }

                })

                // console.log(points["5577c0f1541b40040baaa5eb"].occupancy)

                var i = 0;
                for (prop in points) {
                    i++;
                    if (show.graphs === true) {
                        if (show.occupancy) {
                            points[prop].occupancy = DataPointsHelperService.normailizePoints(points[prop].occupancy, offset, dr, true, show.dontExtrapolate, i == 1);
                        }
                        if (show.leased && points[prop].leased) {
                            points[prop].leased = DataPointsHelperService.normailizePoints(points[prop].leased, offset, dr, true, show.dontExtrapolate);
                        }
                        if (show.atr && points[prop].atr) {
                            points[prop].atr = DataPointsHelperService.normailizePoints(points[prop].atr, offset, dr, true, show.dontExtrapolate);
                        }
                        if (show.renewal && points[prop].renewal) {
                            points[prop].renewal = DataPointsHelperService.normailizePoints(points[prop].renewal, offset, dr, true, show.dontExtrapolate);
                        }
                        if (show.traffic) {
                            points[prop].traffic = DataPointsHelperService.normailizePoints(points[prop].traffic, offset, dr, true, show.dontExtrapolate);
                        }
                        if (show.leases) {
                            points[prop].leases = DataPointsHelperService.normailizePoints(points[prop].leases, offset, dr, true, show.dontExtrapolate);
                        }

                        if (show.rent || show.rentsqft) {
                            points[prop].rent = DataPointsHelperService.normailizePoints(points[prop].rent, offset, dr, true, show.dontExtrapolate);
                        }

                        if (show.rentsqft) {
                            points[prop].rentsqft = DataPointsHelperService.normailizePoints(points[prop].rentsqft, offset, dr, true, show.dontExtrapolate);
                        }

                        if (show.runrate || show.runratesqft) {
                            points[prop].runrate = DataPointsHelperService.normailizePoints(points[prop].runrate, offset, dr, true, show.dontExtrapolate);
                        }

                        if (show.runratesqft) {
                            points[prop].runratesqft = DataPointsHelperService.normailizePoints(points[prop].runratesqft, offset, dr, true, show.dontExtrapolate);
                        }

                        if (show.nersqft) {
                            points[prop].nersqft = DataPointsHelperService.normailizePoints(points[prop].nersqft, offset, dr, true, show.dontExtrapolate);
                        }

                        if (show.concessions) {
                            points[prop].concessions = DataPointsHelperService.normailizePoints(points[prop].concessions, offset, dr, true, show.dontExtrapolate);
                            points[prop].concessionsMonthly = DataPointsHelperService.normailizePoints(points[prop].concessionsMonthly, offset, dr, true, show.dontExtrapolate);
                            points[prop].concessionsOneTime = DataPointsHelperService.normailizePoints(points[prop].concessionsOneTime, offset, dr, true, show.dontExtrapolate);
                        }

                        if (show.ner || show.nersqft || show.scale === "nersqft") {
                            points[prop].ner = DataPointsHelperService.normailizePoints(points[prop].ner, offset, dr, true, show.dontExtrapolate);

                            bedroomBeakdown.forEach(function (b) {
                                points[prop][b] = DataPointsHelperService.normailizePoints(points[prop][b], offset, dr, true, show.dontExtrapolate);
                                points[prop][b + "_sqft"] = DataPointsHelperService.normailizePoints(points[prop][b + "_sqft"], offset, dr, true, show.dontExtrapolate);
                                points[prop][b + "_nersqft"] = DataPointsHelperService.normailizePoints(points[prop][b + "_nersqft"], offset, dr, true, show.dontExtrapolate);
                            });
                        }

                        if (show.nersqft || show.rentsqft || show.runratesqft || show.scale === "nersqft") {
                            points[prop].sqft = DataPointsHelperService.normailizePoints(points[prop].sqft, offset, dr, true, show.dontExtrapolate);
                        }
                    }

                    if (show.occupancy) {
                        points[prop].occupancy = DataPointsHelperService.objectToArray(points[prop].occupancy);
                    }
                    if (show.leased) {
                        points[prop].leased = DataPointsHelperService.objectToArray(points[prop].leased);
                    }
                    if (show.atr) {
                        points[prop].atr = DataPointsHelperService.objectToArray(points[prop].atr);
                    }
                    if (show.renewal) {
                        points[prop].renewal = DataPointsHelperService.objectToArray(points[prop].renewal);
                    }
                    if (show.traffic) {
                        points[prop].traffic = DataPointsHelperService.objectToArray(points[prop].traffic);
                    }
                    if (show.leases) {
                        points[prop].leases = DataPointsHelperService.objectToArray(points[prop].leases);
                    }
                    if (show.rent || show.rentsqft)  {
                        points[prop].rent = DataPointsHelperService.objectToArray(points[prop].rent);
                    }
                    if (show.rentsqft) {
                        points[prop].rentsqft = DataPointsHelperService.objectToArray(points[prop].rentsqft);
                    }
                    if (show.runrate || show.runratesqft) {
                        points[prop].runrate = DataPointsHelperService.objectToArray(points[prop].runrate);
                    }
                    if (show.runratesqft) {
                        points[prop].runratesqft = DataPointsHelperService.objectToArray(points[prop].runratesqft);
                    }
                    if (show.nersqft) {
                        points[prop].nersqft = DataPointsHelperService.objectToArray(points[prop].nersqft);
                    }
                    if (show.concessions) {
                        points[prop].concessions = DataPointsHelperService.objectToArray(points[prop].concessions);
                        points[prop].concessionsMonthly = DataPointsHelperService.objectToArray(points[prop].concessionsMonthly);
                        points[prop].concessionsOneTime = DataPointsHelperService.objectToArray(points[prop].concessionsOneTime);
                    }
                    if (show.ner || show.runratesqft || show.scale === "nersqft") {
                        points[prop].ner = DataPointsHelperService.objectToArray(points[prop].ner);

                        bedroomBeakdown.forEach(function (b) {
                            points[prop][b] = DataPointsHelperService.objectToArray(points[prop][b]);
                            points[prop][b + "_sqft"] = DataPointsHelperService.objectToArray(points[prop][b + "_sqft"]);
                            points[prop][b + "_nersqft"] = DataPointsHelperService.objectToArray(points[prop][b + "_nersqft"]);
                        });
                    }

                    if (show.nersqft || show.rentsqft || show.runratesqft || show.scale === "nersqft") {
                        points[prop].sqft = DataPointsHelperService.objectToArray(points[prop].sqft);
                    }

                    if (!show.dontExtrapolate) {
                        if (show.occupancy) {
                            points[prop].occupancy = DataPointsHelperService.extrapolateMissingPoints(points[prop].occupancy, true);
                        }
                        if (show.leased) {
                            points[prop].leased = DataPointsHelperService.extrapolateMissingPoints(points[prop].leased, true);
                        }
                        if (show.renewal) {
                            points[prop].renewal = DataPointsHelperService.extrapolateMissingPoints(points[prop].renewal, true);
                        }
                        if (show.atr) {
                            points[prop].atr = DataPointsHelperService.extrapolateMissingPoints(points[prop].atr, true);
                        }
                        if (show.traffic) {
                            points[prop].traffic = DataPointsHelperService.extrapolateMissingPoints(points[prop].traffic, true);
                        }
                        if (show.leases) {
                            points[prop].leases = DataPointsHelperService.extrapolateMissingPoints(points[prop].leases, true);
                        }

                        if (show.rent || show.rentsqft) {
                            points[prop].rent = DataPointsHelperService.extrapolateMissingPoints(points[prop].rent, true);
                        }
                        if (show.rentsqft) {
                            points[prop].rentsqft = DataPointsHelperService.extrapolateMissingPoints(points[prop].rentsqft, true);
                        }
                        if (show.runrate || show.runratesqft) {
                            points[prop].runrate = DataPointsHelperService.extrapolateMissingPoints(points[prop].runrate, true);
                        }
                        if (show.runratesqft) {
                            points[prop].runratesqft = DataPointsHelperService.extrapolateMissingPoints(points[prop].runratesqft, true);
                        }
                        if (show.nersqft) {
                            points[prop].nersqft = DataPointsHelperService.extrapolateMissingPoints(points[prop].nersqft, true);
                        }
                        if (show.concessions) {
                            points[prop].concessions = DataPointsHelperService.extrapolateMissingPoints(points[prop].concessions, true);
                            points[prop].concessionsMonthly = DataPointsHelperService.extrapolateMissingPoints(points[prop].concessionsMonthly, true);
                            points[prop].concessionsOneTime = DataPointsHelperService.extrapolateMissingPoints(points[prop].concessionsOneTime, true);
                        }

                        if (show.ner || show.nersqft || show.scale === "nersqft") {
                            points[prop].ner = DataPointsHelperService.extrapolateMissingPoints(points[prop].ner, true);

                            bedroomBeakdown.forEach(function (b) {
                                points[prop][b] = DataPointsHelperService.extrapolateMissingPoints(points[prop][b], true);
                                points[prop][b + "_sqft"] = DataPointsHelperService.extrapolateMissingPoints(points[prop][b + "_sqft"], true);
                                points[prop][b + "_nersqft"] = DataPointsHelperService.extrapolateMissingPoints(points[prop][b + "_nersqft"], true);
                            });
                        }

                        if (show.nersqft || show.rentsqft || show.runratesqft || show.scale === "nersqft") {
                            points[prop].sqft = DataPointsHelperService.extrapolateMissingPoints(points[prop].sqft, true);
                        }
                    }

                }

                if (summary || bedrooms == -2 || show.averages) {
                    newpoints = {averages: {}}

                    // Only Avergage if we want comps grouped
                    if (summary || show.averages) {
                        if (show.occupancy) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "occupancy", true);
                        }
                        if (show.leased) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "leased", true);
                        }
                        if (show.renewal) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "renewal", true);
                        }
                        if (show.atr) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "atr", true);
                        }
                        if (show.traffic) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "traffic", true);
                        }
                        if (show.leases) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "leases", true);
                        }
                        if (show.rent|| show.rentsqft) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "rent", true);
                        }
                        if (show.rentsqft) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "rentsqft", true);
                        }

                        if (show.runrate || show.runratesqft) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "runrate", true);
                        }
                        if (show.runratesqft) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "runratesqft", true);
                        }

                        if (show.nersqft) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "nersqft", true);
                        }
                        if (show.concessions) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "concessions", true);
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "concessionsMonthly", true);
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "concessionsOneTime", true);
                        }

                        if (show.ner || show.nersqft || show.scale === "nersqft") {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "ner", true);
                        }

                        if (show.nersqft || show.rentsqft || show.runratesqft || show.scale === "nersqft") {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, "sqft", true);
                        }
                    }

                    // Go in here if we only want the "All" feature
                    if (bedrooms == -2) {
                        bedroomBeakdown.forEach(function (b) {
                            if (points[prop][b]) {
                                DataPointsHelperService.getSummary(points, subject._id, newpoints, b.toString(), true);
                                DataPointsHelperService.getSummary(points, subject._id, newpoints, b.toString() + "_sqft", true);
                                DataPointsHelperService.getSummary(points, subject._id, newpoints, b.toString() + "_nersqft", true);
                            }
                        });
                    }

                    // If we dont want summary, put back other non-summary points
                    if (!summary && (bedrooms == -2 || show.averages)) {
                        for (prop in points) {
                            if (prop != subject._id.toString()) {
                                newpoints[prop] = points[prop];
                            }
                        }
                    }

                    // Fix averages of anything / sqft

                    if (newpoints.averages.sqft) {
                        newpoints.averages.sqft.forEach((sq, i) => {
                            if (sq.v) {
                                if (newpoints.averages.ner) {
                                    newpoints.averages.nersqft[i].v = newpoints.averages.ner[i].v / sq.v;
                                }

                                if (newpoints.averages.rent) {
                                    newpoints.averages.rentsqft[i].v = newpoints.averages.rent[i].v / sq.v;
                                }

                                if (newpoints.averages.runrate) {
                                    newpoints.averages.runratesqft[i].v = newpoints.averages.runrate[i].v / sq.v;
                                }
                            }
                        });
                    }

                    if (switchBackNer) {
                        bedroomBeakdown.forEach(function(b) {
                            newpoints.averages[b + "_sqft"].forEach((sq, i) => {
                                if (sq.v) {
                                    newpoints.averages[b][i].v = newpoints.averages[b][i].v / sq.v;
                                }
                            });
                        });
                    }

                    points = newpoints;
                }

                // Remove unit counts when not averaging points
                let dim;
                for (prop in points) {
                    for (dim in points[prop]) {
                        if (points[prop][dim].length) {
                            points[prop][dim].forEach(function (p) {
                                if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                    p.v = p.v.value;
                                }
                            });
                        }
                    }
                }

                if (switchBackNer) {
                    if (points.averages) {
                        points.averages.ner = points.averages.nersqft;
                    }

                    for (prop in points) {
                        points[prop].ner = points[prop].nersqft;
                        bedroomBeakdown.forEach(function(b) {
                            points[prop][b] = points[prop][b + "_nersqft"];
                        });
                    }
                }

                points.excluded = excluded;
                callback(points);
            } catch (ex) {
                console.error(ex);
                error.send(ex, {hide, subject, comps, summary, bedrooms, daterange, offset, show});
                callback([]);
            }
        });
    },
}