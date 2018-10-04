'use strict';
var express = require('express');
var async = require("async");
var _ = require("lodash")
var Routes = express.Router();
/////////////////////////////////
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var CloneService = require('../services/cloneService')
var OrgService = require('../../organizations/services/organizationService')
var AmenityService = require('../../amenities/services/amenityService')
var saveCompsService = require('../services/saveCompsService')
const PropertyMassUpdateService = require("../../../build/properties/services/PropertyMassUpdateService");
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

Routes.post("/:id/clone", function(req, res) {
    PropertyService.search(req.user, {
        limit: 100,
        permission: "PropertyView",
        ids: [req.params.id],
        select: "*"}, function(err, subject) {
            CloneService.cloneCustom(req.user, req.context, subject[0], req.user.orgs[0]._id, function(id) {
            // if (req.body.comps) {
            //     // subject[0].comps = _.sortByAll(subject[0].comps, ['orderNumber','name']);
            //     //remove subject as comp
            //     _.remove(subject[0].comps, function(x) {return x.id.toString() == req.params.id});
            //     //Get only ids
            //     var compIds = _.map(subject[0].comps, function(x) {return x.id});
            //
            //     //Lookup comps to get name so we can sort by name if no order is available.
            //     PropertyService.search(req.user, {
            //         limit: 100,
            //         permission: 'PropertyView',
            //         ids: compIds,
            //         select: "name"}, function(err, comps) {
            //             var comp;
            //             //Join to get name
            //             subject[0].comps.forEach(c=> {
            //                 comp = _.find(comps,function(x) {return x._id.toString() == c.id.toString()});
            //                 c.name = comp.name;
            //                 delete c.floorplans;
            //             })
            //             //Sort by order number, and name if no order
            //             subject[0].comps = _.sortByAll(subject[0].comps, ['orderNumber','name']);
            //
            //             //Get ids in the correct order now.
            //             compIds = _.map(subject[0].comps, function(x) {return x.id});
            //
            //             saveCompsService.saveComps(req.user, req.context, id, compIds, function () {
            //                 return res.status(200).json({id: id});
            //             })
            //     });
            // }
            // else {
                return res.status(200).json({id: id});
            // }
        });
    });
});

Routes.put('/:id/active', function (req, res) {
    AccessService.canAccess(req.user,"Properties/Deactivate", function(canAccess) {
        //You can now deactivate custom proeprties.. need more logic here at some point to secure this properly
        // if (!canAccess) {
        //     return res.status(401).json("Unauthorized request");
        // }
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

    if (req.isCustom) {
        permission = "Properties/Custom"
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

Routes.post("/massUpdate", function (req, res) {
    AccessService.canAccess(req.user, "Admin", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }
        PropertyMassUpdateService.massUpdate(req.user, req.context, req.body.propertyIds, req.body.type, req.body.newValue, req.body.oldValue).then((success) => {
            return res.status(200).json({success: true});
        }).catch((error) => {
            return res.status(200).json({success: false, error: error.message});
        });
    });
});

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
                "geo":{"loc": [geo[0].latitude, geo[0].longitude], "distance": .1},
                select: "name address city state zip totalUnits loc",
                exclude: req.body.exclude,
                hideCustom: true
            }, function(err, props) {
                console.log([geo[0].latitude, geo[0].longitude], props.length);
                if (props && props[0]) {

                    PropertyService.search(req.user, {
                        limit: 1,
                        select: "name address city state zip totalUnits",
                        ids: req.body.exclude
                    }, function(err, subjects) {
                        var email = {
                            to: "alex@biradix.com,eugene@biradix.com",
                            subject: "Duplicate Comp Match",
                            logo: "https://platform.biradix.com/images/organizations/biradix.png",
                            template: 'debug.html',
                            templateData: {
                                debug: '<hr>User: ' + req.user.first + ' ' + req.user.last + " (" + req.user.email + ")<hr> \
                            New Property: " + req.body.name + " (" + req.body.address + ")<hr> \
                            Subject Property: " + subjects[0].name + "(" + req.body.exclude + ")<hr> \
                            Existing Duplicate Property: " + props[0].name + " (" + props[0]._id + ")<hr>"
                            }
                        };

                        EmailService.send(email, function (emailError, status) {
                        })

                        return res.status(200).json({property: props[0]});
                    });
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
Routes.post('/checkDupeSubject', function(req, res) {
    GeocodeService.geocode(req.body.address, true, function (err, geo, fromCache) {
        if (geo && geo[0]) {
            PropertyService.search(req.user, {
                limit: 1,
                "active":true,
                "geo":{"loc": [geo[0].latitude, geo[0].longitude], "distance": .1},
                select: "name address city state zip totalUnits",
                hideCustom: true
            }, function(err, props) {
                console.log([geo[0].latitude, geo[0].longitude], props.length);
                if (props && props[0]) {
                    var email = {
                        to: "alex@biradix.com,eugene@biradix.com",
                        subject: "Duplicate Subject Match",
                        logo: "https://platform.biradix.com/images/organizations/biradix.png",
                        template: 'debug.html',
                        templateData: {
                            debug: '<hr>User: ' + req.user.first + ' ' + req.user.last + " (" + req.user.email + ")<hr> \
                        New Property: " + req.body.name + " (" + req.body.address + ")<hr> \
                        Existing Duplicate Property: " + props[0].name + " (" + props[0]._id + ")<hr>",
                        },
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