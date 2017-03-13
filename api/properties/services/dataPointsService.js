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

        if (show.renewal) {
            select += " renewal"
        }
        
        if (show.leases) {
            select += " weeklyleases"
        }

        if (show.traffic) {
            select += " weeklytraffic"
        }

        if (show.ner) {
            select += " exclusions floorplans.id floorplans.rent floorplans.concessions floorplans.bedrooms floorplans.bathrooms floorplans.sqft"
        }

        query = query.select(select)

        query = query.sort("date");

        query.exec(function(err, surveys) {
            if (err) {
                return callback({});
            }

            var bedroomBeakdown = [];

            var points = {};
            var excluded = false;



            if (show.bedrooms && subject.survey){

                var fps = _.flatten(_.map(_.filter(surveys, function(x) {return x.propertyid.toString() == subject._id.toString()}), function(x) {
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


            surveys.forEach(function(s) {

                var dateKey = parseInt(moment.utc(s.date).add(offset,"minute").startOf("day").subtract(offset,"minute").format('x'));

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

                if (show.ner) {
                    points[s.propertyid].ner = points[s.propertyid].ner || {};

                    var nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps, show.scale);
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
            for (var prop in points) {

                if (show.graphs === true) {
                    if (show.occupancy) {
                        points[prop].occupancy = DataPointsHelperService.normailizePoints(points[prop].occupancy, offset, dr);
                    }
                    if (show.leased && points[prop].leased) {
                        points[prop].leased = DataPointsHelperService.normailizePoints(points[prop].leased, offset, dr);
                    }
                    if (show.renewal && points[prop].renewal) {
                        points[prop].renewal = DataPointsHelperService.normailizePoints(points[prop].renewal, offset, dr);
                    }                    
                    if (show.traffic) {
                        points[prop].traffic = DataPointsHelperService.normailizePoints(points[prop].traffic, offset, dr);
                    }
                    if (show.leases) {
                        points[prop].leases = DataPointsHelperService.normailizePoints(points[prop].leases, offset, dr);
                    }

                    if (show.ner) {
                        points[prop].ner = DataPointsHelperService.normailizePoints(points[prop].ner, offset, dr, true);

                        bedroomBeakdown.forEach(function (b) {
                            points[prop][b] = DataPointsHelperService.normailizePoints(points[prop][b], offset, dr, true);
                        })
                    }
                }


                if (show.occupancy) {
                    points[prop].occupancy = DataPointsHelperService.objectToArray(points[prop].occupancy);
                }
                if (show.leased) {
                    points[prop].leased = DataPointsHelperService.objectToArray(points[prop].leased);
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
                if (show.ner) {
                    points[prop].ner = DataPointsHelperService.objectToArray(points[prop].ner);

                    bedroomBeakdown.forEach(function(b) {
                        points[prop][b] = DataPointsHelperService.objectToArray(points[prop][b]);
                    })
                }

                if (show.occupancy) {
                    points[prop].occupancy = DataPointsHelperService.extrapolateMissingPoints(points[prop].occupancy);
                }
                if (show.leased) {
                    points[prop].leased = DataPointsHelperService.extrapolateMissingPoints(points[prop].leased);
                }
                if (show.traffic) {
                    points[prop].traffic = DataPointsHelperService.extrapolateMissingPoints(points[prop].traffic);
                }
                if (show.leases) {
                    points[prop].leases = DataPointsHelperService.extrapolateMissingPoints(points[prop].leases);
                }

                if (show.ner) {
                    points[prop].ner = DataPointsHelperService.extrapolateMissingPoints(points[prop].ner, true);

                    bedroomBeakdown.forEach(function(b) {
                        points[prop][b] = DataPointsHelperService.extrapolateMissingPoints(points[prop][b], true);
                    })
                }

            }

            if (summary || bedrooms -2) {
                var newpoints = {averages:{}}
                if (show.occupancy) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'occupancy');
                }
                if (show.leased) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'leased');
                }
                if (show.traffic) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'traffic');
                }

                if (show.leases) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'leases');
                }

                if (show.ner) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'ner', true);
                }

                if (bedrooms == -2) {
                    bedroomBeakdown.forEach(function(b) {
                        if (points[prop][b]) {
                            DataPointsHelperService.getSummary(points, subject._id, newpoints, b.toString(), true);
                        }
                    });

                }

                points = newpoints;
            }

            //Remove unit counts when not averaging points
            if (show.ner) {
                for (var prop in points) {
                    points[prop].ner.forEach(function(p) {
                        if (p.v && typeof p.v == "object" && typeof p.v.totalUnits == "number") {
                            p.v = p.v.value;
                        }
                    });

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