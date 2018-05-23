'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var DateService = require('../../utilities/services/dateService')
var DataPointsHelperService = require('./dataPointsHelperService')
var SurveySchema= require('../schemas/surveySchema')

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

        if (show.ner || show.rent || show.rentsqft || show.nersqft || show.concessions || show.runrate || show.runratesqft) {
            select += " exclusions floorplans.id floorplans.rent floorplans.concessions floorplans.concessionsMonthly floorplans.concessionsOneTime floorplans.bedrooms floorplans.bathrooms floorplans.sqft"
        }

        query = query.select(select)

        query = query.sort("date");

        var timer = new Date().getTime();
        query.exec(function(err, surveys) {
            // console.log("Downloading " + surveys.length + " surveys for points " + ((new Date().getTime() - timer) / 1000) + "s");
            if (err) {
                return callback({});
            }

            var bedroomBeakdown = [];

            var points = {};
            var excluded = false;



            if (show.bedrooms){

                //if we are doing "All" on dashboard, get bedrooms from subject property
                var propertyid;
                if (bedrooms == -2) {
                    propertyid = subject._id.toString()
                } else {
                    propertyid = comps[0]._id.toString()
                }

                var fps = _.flatten(_.map(_.filter(surveys, function(x) {return x.propertyid.toString() == propertyid}), function(x) {
                    return x.floorplans
                }));

                var includedFps = _.filter(fps, function (x) {
                    if (x.excluded) {
                        excluded = true;
                    }
                    return !hide || !x.excluded
                });

                bedroomBeakdown =  _.uniq(_.pluck(includedFps, 'bedrooms'));
            }


            var dateKey;
            var nerPoint;
            var prop;
            var newpoints;

            surveys.forEach(function(s) {

                dateKey = parseInt(moment.utc(s.date).add(offset,"minute").startOf("day").subtract(offset,"minute").format('x'));

                points[s.propertyid] = points[s.propertyid] || {};

                if (show.graphs !==  true) {
                    points[s.propertyid].surveys = points[s.propertyid].surveys || {};
                    points[s.propertyid].surveys[dateKey] = s._id;
                }

                if (show.occupancy) {
                    points[s.propertyid].occupancy = points[s.propertyid].occupancy || {};
                    points[s.propertyid].occupancy[dateKey] = s.occupancy;
                }

                if (show.leased && s.leased != null) {
                    points[s.propertyid].leased = points[s.propertyid].leased || {};
                    points[s.propertyid].leased[dateKey] = s.leased;
                }

                if (show.atr && s.atr_percent != null) {
                    points[s.propertyid].atr = points[s.propertyid].atr || {};
                    points[s.propertyid].atr[dateKey] = s.atr_percent;
                }

                if (show.renewal && s.renewal != null) {
                    points[s.propertyid].renewal = points[s.propertyid].renewal || {};
                    points[s.propertyid].renewal[dateKey] = s.renewal;
                }
                
                if (show.leases) {
                    points[s.propertyid].leases = points[s.propertyid].leases || {};
                    points[s.propertyid].leases[dateKey] = s.weeklyleases;
                }

                if (show.traffic) {
                    points[s.propertyid].traffic = points[s.propertyid].traffic || {};
                    points[s.propertyid].traffic[dateKey] = s.weeklytraffic;
                }

                if (show.rent) {
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

                if (show.runrate) {
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

                if (show.ner) {
                    points[s.propertyid].ner = points[s.propertyid].ner || {};

                    nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, show.scale);
                    points[s.propertyid].ner[dateKey] = nerPoint;

                    if (nerPoint.excluded) {
                        excluded = true;
                    }

                    bedroomBeakdown.forEach(function(b) {
                        points[s.propertyid][b] = points[s.propertyid][b] || {};
                        points[s.propertyid][b][dateKey] = points[s.propertyid][b][dateKey] || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, b, hide, subject, comps, show.scale);
                        points[s.propertyid][b][dateKey] = nerPoint;
                    })

                }

            })

            //console.log(points["5577c0f1541b40040baaa5eb"].occupancy)

            var i = 0;
            for (prop in points) {
                i++;
                if (show.graphs === true) {
                    if (show.occupancy) {
                        points[prop].occupancy = DataPointsHelperService.normailizePoints(points[prop].occupancy, offset, dr, false, show.dontExtrapolate, i == 1);
                    }
                    if (show.leased && points[prop].leased) {
                        points[prop].leased = DataPointsHelperService.normailizePoints(points[prop].leased, offset, dr, false, show.dontExtrapolate);
                    }
                    if (show.atr && points[prop].atr) {
                        points[prop].atr = DataPointsHelperService.normailizePoints(points[prop].atr, offset, dr, false, show.dontExtrapolate);
                    }
                    if (show.renewal && points[prop].renewal) {
                        points[prop].renewal = DataPointsHelperService.normailizePoints(points[prop].renewal, offset, dr, false, show.dontExtrapolate);
                    }                    
                    if (show.traffic) {
                        points[prop].traffic = DataPointsHelperService.normailizePoints(points[prop].traffic, offset, dr, false, show.dontExtrapolate);
                    }
                    if (show.leases) {
                        points[prop].leases = DataPointsHelperService.normailizePoints(points[prop].leases, offset, dr, false, show.dontExtrapolate);
                    }

                    if (show.rent) {
                        points[prop].rent = DataPointsHelperService.normailizePoints(points[prop].rent, offset, dr, true, show.dontExtrapolate);
                    }

                    if (show.rentsqft) {
                        points[prop].rentsqft = DataPointsHelperService.normailizePoints(points[prop].rentsqft, offset, dr, true, show.dontExtrapolate);
                    }

                    if (show.runrate) {
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

                    if (show.ner) {
                        points[prop].ner = DataPointsHelperService.normailizePoints(points[prop].ner, offset, dr, true, show.dontExtrapolate);

                        bedroomBeakdown.forEach(function (b) {
                            points[prop][b] = DataPointsHelperService.normailizePoints(points[prop][b], offset, dr, true, show.dontExtrapolate);
                        })
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
                if (show.rent) {
                    points[prop].rent = DataPointsHelperService.objectToArray(points[prop].rent);
                }
                if (show.rentsqft) {
                    points[prop].rentsqft = DataPointsHelperService.objectToArray(points[prop].rentsqft);
                }
                if (show.runrate) {
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
                if (show.ner) {
                    points[prop].ner = DataPointsHelperService.objectToArray(points[prop].ner);

                    bedroomBeakdown.forEach(function(b) {
                        points[prop][b] = DataPointsHelperService.objectToArray(points[prop][b]);
                    })
                }

                if (!show.dontExtrapolate) {
                    if (show.occupancy) {
                        points[prop].occupancy = DataPointsHelperService.extrapolateMissingPoints(points[prop].occupancy);
                    }
                    if (show.leased) {
                        points[prop].leased = DataPointsHelperService.extrapolateMissingPoints(points[prop].leased);
                    }
                    if (show.atr) {
                        points[prop].atr = DataPointsHelperService.extrapolateMissingPoints(points[prop].atr);
                    }
                    if (show.traffic) {
                        points[prop].traffic = DataPointsHelperService.extrapolateMissingPoints(points[prop].traffic);
                    }
                    if (show.leases) {
                        points[prop].leases = DataPointsHelperService.extrapolateMissingPoints(points[prop].leases);
                    }

                    if (show.rent) {
                        points[prop].rent = DataPointsHelperService.extrapolateMissingPoints(points[prop].rent, true);
                    }
                    if (show.rentsqft) {
                        points[prop].rentsqft = DataPointsHelperService.extrapolateMissingPoints(points[prop].rentsqft, true);
                    }
                    if (show.runrate) {
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

                    if (show.ner) {
                        points[prop].ner = DataPointsHelperService.extrapolateMissingPoints(points[prop].ner, true);

                        bedroomBeakdown.forEach(function (b) {
                            points[prop][b] = DataPointsHelperService.extrapolateMissingPoints(points[prop][b], true);
                        })
                    }
                }

            }

            if (summary || bedrooms == -2 || show.averages) {
                newpoints = {averages:{}}

                //Only Avergage if we want comps grouped
                if (summary || show.averages) {
                    if (show.occupancy) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'occupancy', true);
                    }
                    if (show.leased) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'leased', true);
                    }
                    if (show.atr) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'atr', true);
                    }
                    if (show.traffic) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'traffic', true);
                    }

                    if (show.leases) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'leases', true);
                    }

                    if (show.rent) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'rent', true);
                    }
                    if (show.rentsqft) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'rentsqft', true);
                    }

                    if (show.runrate) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'runrate', true);
                    }
                    if (show.runratesqft) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'runratesqft', true);
                    }
                    
                    if (show.nersqft) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'nersqft', true);
                    }
                    if (show.concessions) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'concessions', true);
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'concessionsMonthly', true);
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'concessionsOneTime', true);
                    }

                    if (show.ner) {
                        DataPointsHelperService.getSummary(points, subject._id, newpoints, 'ner', true);
                    }
                }

                //Go in here if we only want the "All" feature
                if (bedrooms == -2) {
                    bedroomBeakdown.forEach(function(b) {
                        if (points[prop][b]) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, b.toString(), true);
                        }
                    });
                }

                //If we dont want summary, put back other non-summary points
                if (!summary && (bedrooms == -2 || show.averages)) {
                    for (prop in points) {
                        if (prop != subject._id.toString()) {
                            newpoints[prop] = points[prop];
                        }
                    }
                }


                points = newpoints;
            }

            //Remove unit counts when not averaging points
            if (show.rent) {
                for (prop in points) {
                    if (points[prop].rent) {
                        points[prop].rent.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }
                }
            }

            if (show.rentsqft) {
                for (prop in points) {
                    if (points[prop].rentsqft) {
                        points[prop].rentsqft.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }
                }
            }

            if (show.runrate) {
                for (prop in points) {
                    if (points[prop].runrate) {
                        points[prop].runrate.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }
                }
            }

            if (show.runratesqft) {
                for (prop in points) {
                    if (points[prop].runratesqft) {
                        points[prop].runratesqft.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }
                }
            }            
            if (show.nersqft) {
                for (prop in points) {
                    if (points[prop].nersqft) {
                        points[prop].nersqft.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }
                }
            }

            if (show.concessions) {
                for (prop in points) {
                    if (points[prop].concessions) {
                        points[prop].concessions.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }

                    if (points[prop].concessionsMonthly) {
                        points[prop].concessionsMonthly.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }

                    if (points[prop].concessionsOneTime) {
                        points[prop].concessionsOneTime.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }
                }
            }

            if (show.ner) {
                for (prop in points) {
                    if (points[prop].ner) {
                        points[prop].ner.forEach(function (p) {
                            if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                p.v = p.v.value;
                            }
                        });
                    }

                    bedroomBeakdown.forEach(function(b) {
                        if (points[prop][b]) {
                            points[prop][b].forEach(function (p) {
                                if (p.v.totalUnits == 0) {
                                    //console.log(prop,b,p);
                                }
                                if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                                    p.v = p.v.value;
                                }
                            });
                        }
                    })
                }
            }

            points.excluded = excluded;
            callback(points);
        });
    },
}