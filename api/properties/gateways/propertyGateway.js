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
var _ = require("lodash")

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

Routes.get('/:id/profile', function (req, res) {
    async.parallel({
        view: function (callbackp) {
            PropertyService.search(req.user, {limit: 1, permission: 'PropertyView', _id: req.params.id
                , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits survey location_amenities community_amenities floorplans comps"
            }, function(err, property, lookups) {
                if (property && property.length > 0) {
                    property[0].comps = _.filter(property[0].comps, function(x) {return x.id == property[0]._id});
                }
                callbackp(err, {p: property, l: lookups})
            })
        },
        modify: function(callbackp) {
            PropertyService.search(req.user, {limit: 1, permission: 'PropertyManage', _id: req.params.id
                , select: "_id"
            }, function(err, property) {
                callbackp(err, property)
            })
        }
    }, function(err, all) {

        if (err) {
            res.status(400).send(err)
        } else {
            var compids = _.pluck(all.view.p[0].comps, "id");
            delete all.view.p[0].compids;

            PropertyService.search(req.user, {
                limit: 1,
                permission: 'PropertyView',
                ids: compids
                ,
                select: "_id name address city state zip loc totalUnits survey.id"
            }, function(err, comps) {
                PropertyService.getLastSurveyStats(req.user.settings.hideUnlinked, all.view.p[0], comps, function () {
                    res.status(200).json({
                        canManage: all.modify.length == 1,
                        properties: all.view.p,
                        lookups: all.view.l,
                        comps: comps
                    })
                })
            })

        }

    });

});

Routes.post('/:id/dashboard', function (req, res) {

    PropertyService.search(req.user, {limit: 1, permission: 'PropertyManage', _id: req.params.id
        , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated loc totalUnits survey comps"
    }, function(err, property) {

        if (err) {
            res.status(400).send(err)
        } else {
            var compids = _.pluck(property[0].comps, "id");
            delete property[0].compids;

            PropertyService.search(req.user, {
                limit: 20,
                permission: 'PropertyView',
                ids: compids
                ,
                select: "_id name address city state zip loc totalUnits survey.id floorplans"
            }, function(err, comps) {

                if (err) {
                    res.status(400).send(err)
                } else {
                    async.parallel({
                        comps: function (callbackp) {
                            PropertyService.getLastSurveyStats(req.user.settings.hideUnlinked, property[0], comps, function() {
                                callbackp(null, comps)
                            })
                        },
                        points: function(callbackp) {
                            PropertyService.getPoints(req.user.settings.hideUnlinked, property[0], comps,
                                req.body.summary,
                                req.body.bedrooms,
                                req.body.daterange,
                                req.body.offset,
                                req.body.show,
                                function(points) {
                                callbackp(null, points)
                            })
                        }
                    }, function(err, all) {
                        all.comps.forEach(function(c) {
                            delete c.floorplans;
                        })
                        res.status(200).json({property: property[0], comps: all.comps, points: all.points})
                    });


                }
            });
        }

    })

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

        PropertyService.saveCompLink(req.params.id, req.params.compid, req.body.floorplans, req.body.excluded, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})


Routes.post('/:id/survey', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyService.createSurvey(req.params.id, req.body, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

Routes.get('/:id/survey/:surveyid', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyService.getSurvey({ids: [req.params.surveyid]}, function (err, survey) {
            if (err) {
                return res.status(400).json({errors: err});
            }
            else {
                return res.status(200).json({survey: survey});
            }
        });
    })
})

module.exports = Routes;