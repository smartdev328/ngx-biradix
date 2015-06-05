'use strict';

var express = require('express');
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var ProgressService = require('../../progress/services/progressService')
var UserService = require('../../users/services/userService')
var moment = require('moment')
var request = require('request')
var phantom = require('phantom-render-stream');
var OrgService = require('../../organizations/services/organizationService')
var AmenityService = require('../../amenities/services/amenityService')
var async = require("async");

var Routes = express.Router();

Routes.put('/:id/comps/:compid', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyService.linkComp(req.params.id, req.params.compid, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

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
            AmenityService.search(function(err, amenities) {
                callbackp(err, amenities)
            })
        }
    }, function(err, all) {
        res.status(200).json({fees: PropertyService.fees, orgs: all.orgs, amenities: all.amenities})
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

Routes.get('/:id/excel', function (req, res) {
    PropertyService.search(req.user, {_id: req.params.id}, function(err, properties) {

        moment().utcOffset(req.query.timezone);

        var p = properties[0];
        var fileName = p.name.replace(/ /g, "_") + '_and_Comps_';

        fileName += moment().format("MM_DD_YYYY");

        fileName += ".xlsx";

        var r = request.post('http://biradixsheets.apphb.com/excel', {
            form: {
                fileName : fileName,
                name: p.name

            }
        }).pipe(res)

        r.on('finish', function () {
            if (req.query.progressId) {
                ProgressService.setComplete(req.query.progressId)
            }
        })


    })


});

Routes.get('/:id/pdf', function (req, res) {
    PropertyService.search(req.user, {_id: req.params.id}, function(err, properties) {
        UserService.getFullUser(req.user, function(full) {
            moment().utcOffset(req.query.timezone);

            var p = properties[0];
            var fileName = p.name.replace(/ /g, "_") + '_and_Comps_';

            fileName += moment().format("MM_DD_YYYY");

            fileName += ".pdf";

            var render = phantom({
                pool        : 5,           // Change the pool size. Defaults to 1
                timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
                format      : 'pdf',      // The default output format. Defaults to png
                quality     : 100,        // The default image quality. Defaults to 100. Only relevant for jpeg format.
            });

            var url = req.protocol + '://' + req.get('host') + "/#/profile/" + p._id;

            var cookies = [{
                'name'     : 'token',   /* required property */
                'value'    : full.token,  /* required property */
                'domain'   : req.hostname,
                'path'     : '/',                /* required property */
                'httponly' : false,
                'secure'   : false,
                'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
            }];

            //console.log('Pdf: ' + url);
            //console.log(cookies);

            res.setHeader("content-type", "application/pdf");
            res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
            var r = render(url, {
                cookies: cookies
            }).pipe(res);

            r.on('finish', function () {
                if (req.query.progressId) {
                    ProgressService.setComplete(req.query.progressId)
                }
            })
        });




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

        PropertyService.updateActive(property, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

Routes.delete('/:id/comps/:compid', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyService.unlinkComp(req.params.id, req.params.compid, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

Routes.post('/:id/comps/:compid', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyService.saveCompLink(req.params.id, req.params.compid, req.body, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})



module.exports = Routes;