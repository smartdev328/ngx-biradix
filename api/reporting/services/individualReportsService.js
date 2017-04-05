var PropertyService = require('../../properties/services/propertyService')
var PropertyHelperService = require('../../properties/services/propertyHelperService')
var _ = require("lodash")
var queues = require('../../../config/queues')
var settings = require('../../../config/settings')

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
    property_report: function(user,reports,subjectid, comps,callback) {
        if (reports.indexOf('property_report')  > -1) {

            var options = {
                daterange: { daterange: "Today"},
                show: {}
            };

            queues.getExchange().publish({user: user, id: subjectid, options: options},
                {
                    key: settings.DASHBOARD_QUEUE,
                    reply: function (data) {
                        callback(data.dashboard);
                    }
                }
            );
        } else {
            callback(null);
        }
    }
}