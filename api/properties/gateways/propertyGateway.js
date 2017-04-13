'use strict';
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
var CreateService = require('../services/createService')
var GeocodeService = require('../../utilities/services/geocodeService')
var EmailService = require('../../business/services/emailService')

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

Routes.get('/getAmenityCounts', function (req, res) {
    PropertyService.getAmenityCounts(function(err,counts) {
        res.status(200).json({counts: counts});    
    })
      
});

Routes.get('/lookups', function (req, res) {
    async.parallel({
        orgs: function (callbackp) {
            AccessService.canAccess(req.user,"Org/Assign", function(canAccess) {

                //If you dont have access to assign orgs, only return orgs you have access to
                if (!canAccess) {
                    callbackp(null, req.user.orgs)
                }
                else {
                    //Return all Orgs
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
        all= null;
    });


});


Routes.post('/', function (req, res) {
    PropertyService.search(req.user, req.body, function(err, properties, lookups) {

        if (err) {
            res.status(400).send(err)
        } else {
            res.status(200).json({properties: properties, lookups: lookups})
        }

        properties = null;
        lookups = null;

    })

});

Routes.get('/:id/approve', function (req, res) {
    AccessService.canAccess(req.user,"Properties/Deactivate", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyService.Approve(req.user, req.params.id, req.context, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

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

//Create Property
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

        CreateService.create(req.user,  req.context, req.body, function (err, newprop) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true, property: newprop});
            }
        });
    })
})

Routes.put('/:id', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.id,['PropertyManage','CompManage'], function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        CreateService.update(req.user,  req.context, null, req.body, {}, function (err, newprop) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true, property: newprop});
            }
        });
    })
});

Routes.post('/checkDupe', function(req, res) {
    GeocodeService.geocode(req.body.address, true, function (err, geo, fromCache) {
        if (geo && geo[0]) {
            PropertyService.search(req.user, {
                limit: 1,
                "active":true,
                "geo":{"loc": [geo[0].latitude, geo[0].longitude], "distance": 0.1},
                select: "name address city state zip totalUnits",
                exclude: req.body.exclude
            }, function(err, props) {
                if (props && props[0]) {

                    var email = {
                        to: "alex@biradix.com,eugene@biradix.com",
                        subject: "Duplicate Comp Match",
                        logo: "https://platform.biradix.com/images/organizations/biradix.png",
                        template: 'debug.html',
                        templateData: {
                            debug: JSON.stringify({
                                user: req.user,
                            }) + "<hr>" +
                            JSON.stringify({
                                adddress: req.body.address,
                            }) + "<hr>"+
                            JSON.stringify({
                                subject: req.body.exclude,
                            }) + "<hr>"+
                            JSON.stringify({
                                property: props[0]
                            }) + "<hr>"
                        }
                    };


                    EmailService.send(email, function (emailError, status) {
                    })

                    return res.status(200).json({property: props[0]});
                } else {
                    return res.status(200).json({property: null});
                }
            })
        }
        else {
            return res.status(200).json({property: null});
        }
    })

});

module.exports = Routes;