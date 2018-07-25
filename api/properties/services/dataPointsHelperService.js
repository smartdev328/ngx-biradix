'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');

var WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = {
    getNerPoint: function(s, bedrooms, hide, subject, comps, scale) {
        var fps = _.flatten(s.floorplans);

        if (bedrooms > -1) {
            fps = _.filter(fps, function (x) {
                return x.bedrooms == bedrooms
            })
        }

        var excluded = false;
        if (hide) {
            var excfps = [];

            //remove any historical exclusions saved in each survey
            if (s.exclusions && s.exclusions.length > 0) {
                var exc = _.find(s.exclusions, function (x) {
                    return x.subjectid == subject._id
                });

                if (exc) {
                    excfps = excfps.concat(exc.floorplans.map(function (x) {
                        return x.toString()
                    }));
                }
            }

            //compare current floorplan to current exclusions to get a current exclusion list
            var currentfps = _.pluck(_.find(comps, function (x) {
                return x._id == s.propertyid
            }).floorplans, "id").map(function (x) {
                return x.toString()
            });

            var incfps = _.find(subject.comps, function (x) {
                return x.id == s.propertyid
            }).floorplans.map(function (x) {
                return x.toString()
            });

            excfps = excfps.concat(_.difference(currentfps, incfps))

            if (excfps.length > 0) {
                var removed = _.remove(fps, function (x) {
                    return excfps.indexOf(x.id.toString()) > -1
                });
                if (removed && removed.length > 0) {
                    excluded = true;
                }
            }
        }

        var tot = _.sum(fps, function (x) {
            if (scale == "concessionsMonthly" && (typeof x.concessionsMonthly == 'undefined' || x.concessionsMonthly == null || isNaN(x.concessionsMonthly)) ) {
                return 0;
            }
            else
            if (scale == "concessionsOneTime" && (typeof x.concessionsOneTime == 'undefined' || x.concessionsOneTime == null || isNaN(x.concessionsOneTime)) ) {
                return 0;
            }

            return x.units
        });

        let ret;

        if (tot > 0) {
            if (scale == "rent" || scale == "rentsqft") {
                ret = _.sum(fps, function(x) {
                    return x.rent * x.units / tot;
                });
            } else if (scale == "runrate") {
                ret = _.sum(fps, function(x) {
                    return (x.rent - (x.concessionsMonthly || 0)) * x.units / tot;
                });
            } else if (scale == "concessions") {
                ret = _.sum(fps, function(x) {
                    return x.concessions * x.units / tot;
                });
            } else if (scale == "concessionsMonthly") {
                ret = _.sum(fps, function(x) {
                    return (x.concessionsMonthly || 0) * x.units / tot;
                });
            } else if (scale == "concessionsOneTime") {
                ret = _.sum(fps, function(x) {
                    return (x.concessionsOneTime || 0) * x.units / tot;
                });
            } else if (scale == "occupancy") {
                ret = s.occupancy;
                if (typeof s.occupancy === "undefined" || s.occupancy === null) {
                    tot = 0;
                }
            } else if (scale == "leased") {
                ret = s.leased;
                if (typeof s.leased === "undefined" || s.leased === null) {
                    tot = 0;
                }
            } else if (scale == "atr") {
                ret = s.atr_percent;
                if (typeof s.atr_percent === "undefined" || s.atr_percent === null) {
                    tot = 0;
                }
            } else if (scale == "renewal") {
                ret = s.renewal;
                if (typeof s.renewal === "undefined" || s.renewal === null) {
                    tot = 0;
                }
            } else if (scale == "leases") {
                ret = s.weeklyleases;
                if (typeof s.weeklyleases === "undefined" || s.weeklyleases === null) {
                    tot = 0;
                }
            } else if (scale == "traffic") {
                ret = s.weeklytraffic;
                if (typeof s.weeklytraffic === "undefined" || s.weeklytraffic === null) {
                    tot = 0;
                }
            } else {
                ret = _.sum(fps, function(x) {
                    return (x.rent - x.concessions / 12 ) * x.units / tot;
                });
            }

            if (scale == "nersqft" || scale == "rentsqft" || scale == "runratesqft") {
                const sqft = _.sum(fps, function(x) {
                    return x.sqft * x.units / tot;
                })
                ret = ret / sqft;
            }
        }

        return {value: tot == 0 ? null : ret, excluded: excluded, totalUnits: tot};
    },
    normailizePoints: function (points, offset, dr, weighted, dontExtrapolate, debug) {
        if (points == {}) {
            return {}
        }

        var monday = parseInt(moment.utc().add(offset, "minute").day("Monday").startOf("day").subtract(offset, "minute").format('x'))
        var nextMonday = monday + WEEK;

        var minDate;

        for (minDate in points) break;

        var ret = {};

        var first = null;

        var rangePoints;
        var d;
        var totalUnits;
        while (parseInt(minDate) < nextMonday) {
            rangePoints = [];

            // if (debug) {
            //     console.log(moment(monday).format(), moment(nextMonday).format());
            // }

            for (d in points) {
                if (parseInt(d) >= monday && parseInt(d) < nextMonday) {
                    // if (debug) {
                    //     console.log(points[d])
                    // }
                    if (points[d] != null && points[d].value != null) {
                        rangePoints.push(points[d]);
                    }
                }
            }

            if (rangePoints.length > 0) {
                if (weighted) {
                    totalUnits = _.sum(rangePoints, function(x) {return x.totalUnits});
                    // weighte average value and totalUnits
                    ret[monday] = {value: _.sum(rangePoints, function(x) {return x.value * x.totalUnits}) / totalUnits, totalUnits: totalUnits / rangePoints.length};
                } else {
                    ret[monday] = _.sum(rangePoints) / rangePoints.length;
                }

                if (first == null) {
                    first = ret[monday];
                }
            }

            monday = monday - WEEK;
            nextMonday = nextMonday - WEEK;
        }

        // console.log(dr.end,moment.utc(dr.end).format(),moment.utc(dr.end).add(offset, "minute").format(),moment.utc(dr.end).add(offset, "minute").startOf("day").format());

        if (!dontExtrapolate) {
            const today = parseInt(moment.utc(dr.end).add(offset, "minute").startOf("day").subtract(offset, "minute").format('x'))

            ret[today] = first;
        }

        return ret;
    },
    extrapolateMissingPoints: function(pts, weighted) {
        let Count = pts.length;

        if (Count < 2) {
            return pts;
        }

        let i = 0;
        let Current;
        let Last = null;
        let Delta = 0;

        while (i < Count) {
            Current = pts[i];
            if (Last != null && Current.d - Last.d > WEEK) {
                if (weighted) {
                    Delta = (Current.v.value - Last.v.value) / (Current.d - Last.d) * WEEK;
                    Current =
                    {
                        d: Last.d + WEEK,
                        v: {value: Last.v.value + Delta, totalUnits: Last.v.totalUnits},
                        f: true,
                    };
                } else {
                    Delta = (Current.v - Last.v) / (Current.d - Last.d) * WEEK;
                    Current =
                    {
                        d: Last.d + WEEK,
                        v: Last.v + Delta,
                        f: true,
                    };
                }

                pts.splice(i, 0, Current);

                i--;
                Count++;
            }

            Last = Current;
            i++;
        }

        return pts;
    },
    objectToArray: function (obj) {
        let ar = [];
        let k;
        for (k in obj) {
            ar.push({d: parseInt(k), v: obj[k]});
        }

        ar = _.sortBy(ar, function(x) {
            return x.d;
        });

        return ar;
    },
    getSummary: function(points, subjectid, newpoints, dimension, weighted) {
        newpoints["averages"][dimension] = [];

        if (dimension === "nersqft") {
            newpoints["averages"][dimension] = newpoints["averages"][dimension]
        }

        let prop;
        for (prop in points) {
            if (prop.toString() === subjectid.toString()) {
                newpoints[prop] = points[prop];
            } else {
                newpoints["averages"][dimension] = newpoints["averages"][dimension].concat(points[prop][dimension]);
            }
        }

        let total;
        const g = _.chain(newpoints["averages"][dimension]).groupBy("d").map(function(v, k) {
            total = v.length;
            if (weighted) {
                total = _.sum(v, function(x) {
                    // return x.c.d; // this causes an error to test
                    if (x.v && x.v.totalUnits) {
                        return x.v.totalUnits;
                    } else {
                        return 0;
                    }                    
                });
            }

            return {
                d: parseInt(k),
                v: _.sum(v, function(x) {
                    if (weighted) {
                        if (x.v && x.v.totalUnits) {
                            return x.v.value * x.v.totalUnits;
                        } else {
                            return 0;
                        }
                    } else {
                        return x.v;
                    }
                }) / total,
            };            
        }).value();

        newpoints["averages"][dimension] = g;
    },
};
