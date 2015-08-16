'use strict';
var settings = require("../../../config/settings")
var express = require('express');
var async = require("async");
var _ = require("lodash")
var Routes = express.Router();
/////////////////////////////////
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var OrgService = require('../../organizations/services/organizationService')
var AmenityService = require('../../amenities/services/amenityService')
/////////////////////
var PropertyHelperService = require('../services/propertyHelperService')
/////////////////////
var SurveyGateway = require('./surveyGateway')
var CompsGateway = require('./compsGateway')
var DashboardGateway = require('./dashboardGateway')
var ExportGateway = require('./exportGateway')
/////////////////////
SurveyGateway.init(Routes)
CompsGateway.init(Routes)
DashboardGateway.init(Routes)
ExportGateway.init(Routes)
/////////////////////

Routes.get('/lookups', function (req, res) {
    async.parallel({
        orgs: function (callbackp) {
            AccessService.canAccess(req.user,"Org/Assign", function(canAccess) {
                if (!canAccess) {
                    callbackp(null, [req.user.org])
                }
                else {
                    OrgService.read(function (err, orgs) {
                        callbackp(null, orgs)
                    });
                }
            });
        },
        amenities: function(callbackp) {
            AmenityService.search({active: true},function(err, amenities) {
                callbackp(err, amenities)
            })
        }
    }, function(err, all) {
        res.status(200).json({fees: PropertyHelperService.fees, orgs: all.orgs, amenities: all.amenities})
    });


});

Routes.post('/:id/reports', function (req, res) {

    var columns = "";
    if (req.body.reports.indexOf('community_amenities') > -1) {
        columns += " community_amenities";
    }

    if (req.body.reports.indexOf('location_amenities') > -1) {
        columns += " location_amenities";
    }

    if (req.body.reports.indexOf('fees_deposits') > -1) {
        columns += " fees";
    }

    if (req.body.reports.indexOf('property_rankings') > -1 || req.body.reports.indexOf('market_share') > -1) {
        columns += " survey.id comps.floorplans";
    }

    PropertyService.search(req.user, {
        limit: 100,
        permission: 'PropertyView',
        ids: (req.body.compids || []).concat([req.params.id])
        ,
        select: "_id name" + columns
    }, function(err, comps, lookups) {
        var results = {};


        if (req.body.reports.indexOf('community_amenities')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {

                c.community_amenities.forEach(function(a) {
                    var v = _.find(lookups.amenities, function(x) {return x._id.toString() == a}).name;
                    compreport.push([c.name, v]);
                })
            })
            results.community_amenities = compreport

        }

        if (req.body.reports.indexOf('location_amenities')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {

                c.location_amenities.forEach(function(a) {
                    var v = _.find(lookups.amenities, function(x) {return x._id.toString() == a}).name;
                    compreport.push([c.name, v]);
                })
            })
            results.location_amenities = compreport
        }

        if (req.body.reports.indexOf('fees_deposits')  > -1) {
            var compreport = [];
            comps.forEach(function(c) {
                for (var f in c.fees) {
                    compreport.push([c.name, lookups.fees[f], c.fees[f]]);
                }

            })
            results.fees_deposits = compreport
        }

        async.parallel({
            floorplans: function (callbackp) {
                var surveyids = _.pluck(comps,"survey.id");
                if (!surveyids || surveyids.length == 0) {
                    callbackp(null, null)
                } else {
                    PropertyService.getSurvey({ids: surveyids,select: "propertyid floorplans"}, function(err, surveys) {
                        var property_rankings = [];

                        var allIncludedFloorplans = PropertyHelperService.flattenAllCompFloorplans(comps, req.params.id);
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

                        callbackp(null, property_rankings)
                    });
                }
            },
            market_share: function (callbackp) {
                callbackp(null, null)
            }
        }, function(err, all) {

            if (all.floorplans) {
                results.floorplans = all.floorplans;
            }

            res.status(200).json(results);
        });


    });

});

Routes.post('/', function (req, res) {
    PropertyService.search(req.user, req.body, function(err, properties, lookups) {

        if (err) {
            res.status(400).send(err)
        } else {
            res.status(200).json({properties: properties, lookups: lookups})
        }

    })

});

Routes.put('/:id/active', function (req, res) {
    AccessService.canAccess(req.user,"Properties/Deactivate", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }
        var property = {};
        property.id = req.params.id;
        property.active = req.body.active;

        PropertyService.updateActive(req.user, property, req.context, null, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

Routes.put('/', function(req,res) {

    //allow anyone with access to properties to create comps (no org new props)
    var permission = "Properties";

    //if orgid is passed restrict to people with create
    if (req.orgid) {
        permission = "Properties/Create"
    }
    AccessService.canAccess(req.user,permission, function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyService.create(req.user,  req.context, req.body, function (err, newprop) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true, property: newprop});
            }
        });
    })
})

module.exports = Routes;