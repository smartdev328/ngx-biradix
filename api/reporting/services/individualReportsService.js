var PropertyService = require('../../properties/services/propertyService')
var PropertyHelperService = require('../../properties/services/propertyHelperService')
var _ = require("lodash")
var bus = require('../../../config/queues')
var settings = require('../../../config/settings')
var async = require("async");

module.exports = {
    getProperties:  function(user, reports, proeprtyids, callback) {

        //optimize to not look up property if we dont have to
        if (
            reports.indexOf('community_amenities') == -1 &&
            reports.indexOf('location_amenities') == -1 &&
            reports.indexOf('fees_deposits') == -1 &&
            reports.indexOf('property_rankings') == -1 &&
            reports.indexOf('property_rankings_summary') == -1
        ) {
            return callback(null,null, null);
        }

        var columns = "";
        if (reports.indexOf('community_amenities') > -1) {
            columns += " community_amenities";
        }

        if (reports.indexOf('location_amenities') > -1) {
            columns += " location_amenities";
        }

        if (reports.indexOf('fees_deposits') > -1) {
            columns += " fees";
        }

        if (reports.indexOf('property_rankings') > -1 || reports.indexOf('property_rankings_summary') > -1) {
            columns += " survey.id comps.floorplans address";
        }

        PropertyService.search(user, {
            limit: 100,
            permission: 'PropertyView',
            ids: proeprtyids
            ,
            select: "_id name" + columns
        }, function(err, comps, lookups) {
            callback(err,comps,lookups);
        });
    }
    ,community_amenities: function(reports,comps,lookups) {
        if (reports.indexOf('community_amenities')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {

                c.community_amenities.forEach(function(a) {
                    var v = _.find(lookups.amenities, function(x) {return x._id.toString() == a}).name;
                    compreport.push([c.name, v]);
                })
            })

            return compreport
        }
        else {
            return null;
        }
    }
    ,location_amenities: function(reports,comps,lookups) {
        if (reports.indexOf('location_amenities')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {

                c.location_amenities.forEach(function(a) {
                    var v = _.find(lookups.amenities, function(x) {return x._id.toString() == a}).name;
                    compreport.push([c.name, v]);
                })
            })

            return compreport
        }
        else {
            return null;
        }
    }
    ,fees_deposits: function(reports,comps,lookups) {
        if (reports.indexOf('fees_deposits')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {
                for (var f in c.fees) {
                    compreport.push([c.name, lookups.fees[f], c.fees[f]]);
                }

            })

            return compreport
        }
        else {
            return null;
        }
    },
    floorplans: function(subjectid, comps, callback) {
        var surveyids = _.pluck(comps,"survey.id");
        if (!surveyids || surveyids.length == 0) {
            callback(null)
        } else {
            PropertyService.getSurvey({ids: surveyids,select: "propertyid floorplans"}, function(err, surveys) {
                var property_rankings = [];

                var allIncludedFloorplans = PropertyHelperService.flattenAllCompFloorplans(comps,subjectid);
                surveys.forEach(function(s) {
                    s.floorplans.forEach(function(fp) {
                        var f = {fid: fp.id, id: s.propertyid, bedrooms: fp.bedrooms, bathrooms: fp.bathrooms, description: fp.description, units: fp.units, sqft: fp.sqft, ner: Math.round((fp.rent - (fp.concessions / 12)) * 100) / 100, nersqft: Math.round((fp.rent - (fp.concessions / 12)) / fp.sqft * 100) / 100};

                        var included = _.find(allIncludedFloorplans, function(x) {return x.toString() == fp.id.toString()})

                        if (!included) {
                            f.excluded = true;
                        }
                        property_rankings.push(f)
                    })
                })

                callback(property_rankings)
            });
        }
    },
    property_report: function(user,reports,subjectid, comps, options, callback) {
        if (reports.indexOf('property_report')  > -1) {
            var timer = new Date().getTime();

            var graphs = options.show.graphs;
            options.show.graphs = true;
            options.show.selectedBedroom = -1;
            options.show.ner = true;
            options.show.occupancy = true;
            options.show.leased = true;
            options.compids = comps;

            var profiles = [];

            bus.query(
                settings.DASHBOARD_QUEUE
                , {user: user, id: subjectid, options: options}
                , function (data) {
                    //console.log("Full Report for " + data.dashboard.property.name + " [dashboard only] " + ((new Date().getTime() - timer) / 1000) + "s");

                    async.eachLimit(data.dashboard.comps, 1, function(comp, callbackp){
                        options.show.graphs = graphs;
                        options.show.traffic = true;
                        options.show.leases = true;
                        options.show.bedrooms = true;

                        bus.query(
                            settings.PROFILE_QUEUE
                            ,{
                                user: user,
                                options: options,
                                checkManaged: false,
                                subjectId: data.dashboard.property._id,
                                compId: comp._id
                            },
                            function (data) {
                                profiles.push(data.profile);
                                callbackp();
                            }
                        );
                    }, function(err) {

                        profiles.forEach(function(c) {
                            var comp = _.find(data.dashboard.comps, function (x) {
                                return x._id.toString() == c.property._id.toString()
                            });

                            c.orderNumber = 999;

                            if (comp && typeof comp.orderNumber != 'undefined') {
                                c.orderNumber = comp.orderNumber;
                            }
                            c.name = comp.name;
                        });

                        profiles = _.sortByAll(profiles, ['orderNumber','name']);

                        console.log("Full Report for " + profiles[0].property.name + " + "  + profiles.length + " comps: " + ((new Date().getTime() - timer) / 1000) + "s");
                        callback({dashboard: data.dashboard, profiles: profiles});
                        data.dashboard = null;
                        profiles = null;
                        data = null;
                    });

                }
            );
        } else {
            callback(null);
        }
    }
    ,
    concession: function(user,reports,subjectid, comps, options, callback) {
        if (reports.indexOf('concession')  > -1) {

            options.show = {};
            options.summary = false;
            options.show.graphs = true;
            options.show.selectedBedroom = -1;
            options.show.ner = true;
            options.show.rent = true;
            options.show.concessions = true;
            options.show.occupancy = false;
            options.show.leased = false;
            options.show.sclae = "ner";
            options.show.averages = true;
            options.compids = comps;

            bus.query(
                settings.DASHBOARD_QUEUE
                , {user: user, id: subjectid, options: options}
                , function (data) {

                    let response = [];

                    var c;
                    var id;
                    var rent, ner, concessions, concessionsMonthly,concessionsOneTime
                    for (id in data.dashboard.points) {
                        c = data.dashboard.comps.find(x => x._id.toString() == id.toString());
                        if (c) {
                            rent = {};
                            data.dashboard.points[id].rent.forEach(x=> {
                                rent[x.d] = x.v;
                            })

                            ner = {};
                            data.dashboard.points[id].ner.forEach(x=> {
                                ner[x.d] = x.v;
                            })

                            concessions = {};
                            data.dashboard.points[id].concessions.forEach(x=> {
                                concessions[x.d] = x.v;
                            })

                            concessionsMonthly = {};
                            data.dashboard.points[id].concessionsMonthly.forEach(x=> {
                                concessionsMonthly[x.d] = x.v;
                            })

                            concessionsOneTime = {};
                            data.dashboard.points[id].concessionsOneTime.forEach(x=> {
                                concessionsOneTime[x.d] = x.v;
                            })

                            response.push({
                                name: c.name,
                                orderNumber : c.orderNumber,
                                points: {
                                    rent: rent,
                                    ner: ner,
                                    concessions: concessions,
                                    concessionsMonthly: concessionsMonthly,
                                    concessionsOneTime: concessionsOneTime
                                },
                            })
                        }

                    }

                    rent = {};
                    data.dashboard.points.averages.rent.forEach(x=> {
                        rent[x.d] = x.v;
                    })

                    ner = {};
                    data.dashboard.points.averages.ner.forEach(x=> {
                        ner[x.d] = x.v;
                    })

                    concessions = {};
                    data.dashboard.points.averages.concessions.forEach(x=> {
                        concessions[x.d] = x.v;
                    })

                    concessionsMonthly = {};
                    data.dashboard.points.averages.concessionsMonthly.forEach(x=> {
                        concessionsMonthly[x.d] = x.v;
                    })

                    concessionsOneTime = {};
                    data.dashboard.points.averages.concessionsOneTime.forEach(x=> {
                        concessionsOneTime[x.d] = x.v;
                    })

                    var averages =  {
                        rent: rent,
                        ner: ner,
                        concessions: concessions,
                        concessionsMonthly: concessionsMonthly,
                        concessionsOneTime: concessionsOneTime
                    };

                    response = _.sortByAll(response, ['orderNumber','name']);

                    response[response.length - 1].last= true;

                    var dates = Object.keys(response[0].points.rent).sort().reverse();

                    //Check last point and remove it if its an extrapolated point for today;
                    // if (dates.length > 1) {
                    //     var diff = (dates[0] - dates[1]) / 1000 / 60 / 60 / 24; //Calc diff in days
                    //     if (diff < 7) {
                    //         dates.splice(0,1);
                    //     }
                    // }

                    //We can only fir 15 dates on the screen
                    dates = _.take(dates,13);

                    callback({data: response, dates: dates, averages: averages});
                    data = null;
                }
            );
        } else {
            callback(null);
        }
    }
}