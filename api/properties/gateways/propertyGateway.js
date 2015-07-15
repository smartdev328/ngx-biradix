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
var settings = require("../../../config/settings")
var emailService = require('../../utilities/services/emailService')

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

Routes.post('/:id/profile', function (req, res) {
    getProfile(req,res, true, req.params.id, req.params.id, function(o) {
        res.status(200).json({profile: o});
    })
});

Routes.post('/:id/dashboard', function (req, res) {

    getDashboard(req,res, function(o) {
        res.status(200).json(o);
    })

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

        res.status(200).json(results);
    });

});

Routes.post('/:id/full', function (req, res) {

    var graphs = req.body.show.graphs;
    var profiles = [];
    req.body.show.graphs = true;
    req.body.show.selectedBedroom = -1;
    req.body.show.ner = true;
    req.body.show.occupancy = true;
    getDashboard(req,res, function(dashboard) {
        async.eachLimit(dashboard.comps, 10, function(comp, callbackp){
            req.body.show.graphs = graphs;
            req.body.show.traffic = true;
            req.body.show.leases = true;
            req.body.show.bedrooms = true;

            getProfile(req,res, false, dashboard.property._id, comp._id, function(profile) {
                profiles.push(profile)
                callbackp();
            })
        }, function(err) {
            res.status(200).json({dashboard: dashboard, profiles: profiles});
        });

    })

});

var getProfile = function(req,res,checkManaged, subjectId, compId, callback) {
    async.parallel({
        subject: function (callbackp) {
            PropertyService.search(req.user, {limit: 1, permission: 'PropertyView', _id: subjectId
                , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits survey location_amenities community_amenities floorplans comps"
            }, function(err, property) {
                callbackp(err, property[0])
            })
        },
        comp: function (callbackp) {
            PropertyService.search(req.user, {limit: 1, permission: 'PropertyView', _id: compId
                , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees totalUnits survey location_amenities community_amenities floorplans"
            }, function(err, property, lookups) {
                callbackp(err, {p: property[0], l: lookups})
            })
        },
        modify: function(callbackp) {

            if (!checkManaged) {
                return callbackp(null,false);
            }
            PropertyService.search(req.user, {limit: 1, permission: 'PropertyManage', _id: req.params.id
                , select: "_id"
            }, function(err, property) {
                callbackp(err, property.length == 1)
            })
        }
    }, function(err, all) {

        if (err) {
            res.status(400).send(err)
        } else {

            PropertyService.search(req.user, {
                limit: 1,
                permission: 'PropertyView',
                ids: [compId]
                ,
                select: "_id name address city state zip loc totalUnits survey.id floorplans"
            }, function(err, comps) {
                async.parallel({
                    comps: function (callbackp) {
                        PropertyService.getLastSurveyStats(req.user.settings.hideUnlinked, all.subject, comps, function() {
                            callbackp(null, comps)
                        })
                    },
                    points: function(callbackp) {
                        PropertyService.getPoints(req.user.settings.hideUnlinked, all.subject, comps,
                            false,
                            -1,
                            req.body.daterange,
                            req.body.offset,
                            req.body.show,
                            function(points) {
                                callbackp(null, points)
                            })
                    }
                }, function(err, all2) {
                    all2.comps.forEach(function(c) {
                        delete c.floorplans;
                        var daysSince = (Date.now() - c.survey.date.getTime()) / 1000 / 60 / 60 / 24;
                        if (daysSince >= 15) {
                            c.survey.tier = "danger";
                        } else if (daysSince >= 8) {
                            c.survey.tier = "warning";
                        }
                    })

                    callback({property: all.comp.p, comps: all2.comps, lookups: all.comp.l, points: all2.points, canManage: all.modify})
                });
            })

        }

    });

}

var getDashboard = function(req,res,callback) {
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
                        callback ({property: property[0], comps: all.comps, points: all.points});
                    });


                }
            });
        }

    })

}
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

    var profiles = [];
    req.body.show = {};
    req.body.show.graphs = false;
    req.body.show.selectedBedroom = -1;
    req.body.show.ner = true;
    req.body.show.occupancy = true;
    req.body.daterange =
    {
        daterange: req.query.selectedRange,
            start: req.query.selectedStartDate,
        end: req.query.selectedEndDate
    }

    getDashboard(req,res, function(dashboard) {
        async.eachLimit(dashboard.comps, 10, function(comp, callbackp){
            req.body.show.traffic = true;
            req.body.show.leases = true;
            req.body.show.bedrooms = true;

            getProfile(req,res, false, dashboard.property._id, comp._id, function(profile) {
                profiles.push(profile)
                callbackp();
            })
        }, function(err) {

            moment().utcOffset(req.query.timezone);

            var p = dashboard.property;
            var fileName = p.name.replace(/ /g, "_") + '_and_Comps_';

            fileName += moment().format("MM_DD_YYYY");

            fileName += ".xlsx";

            profiles = _.sortBy(profiles, function (n) {

                if (n.property._id.toString() == dashboard.property._id.toString()) {
                    return "-1";
                }
                return n.property.name;
            })

            var email = {
                from: 'support@biradix.com',
                to: 'alex@viderman.com',
                subject: 'Json',
                html: JSON.stringify({fileName: fileName,dashboard: dashboard, profiles: profiles, utcOffset: req.query.timezone})
            };

            emailService.send(email, function(err, status) {
                console.log(err, status)
                var r = request.post(settings.EXCEL_URL, {
                    json: {fileName: fileName,dashboard: dashboard, profiles: profiles, utcOffset: req.query.timezone}
                }).pipe(res)

                r.on('finish', function () {
                    if (req.query.progressId) {
                        ProgressService.setComplete(req.query.progressId)
                    }
                })
            });


        });

    })


});

Routes.get('/:id/pdf', function (req, res) {
    PropertyService.search(req.user, {_id: req.params.id}, function(err, properties) {
        UserService.getFullUser(req.user, function(full) {
            moment().utcOffset(req.query.timezone);

            var p = properties[0];
            var fileName = p.name.replace(/ /g, "_");

            if (req.query.full == "true") {
                fileName += '_and_Comps';
            }

            fileName += "_" + moment().format("MM_DD_YYYY");

            fileName += ".pdf";

            var options = {
                pool        : 5,           // Change the pool size. Defaults to 1
                timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
                format      : 'pdf',      // The default output format. Defaults to png
                quality     : 100,         // The default image quality. Defaults to 100. Only relevant for jpeg format.
                width       : 1280,        // Changes the width size. Defaults to 1280
                height      : 960,         // Changes the height size. Defaults to 960
                paperFormat : 'Letter',        // Defaults to A4. Also supported: 'A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'.
                orientation : 'portrait',  // Defaults to portrait. 'landscape' is also valid
                margin      : '0.1in',       // Defaults to 0cm. Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'.
                userAgent   : '',          // No default.
                headers     : {}, // Additional headers to send with each upstream HTTP request
                paperSize   : null,        // Defaults to the paper format, orientation, and margin.
                crop        : false,       // Defaults to false. Set to true or {top:5, left:5} to add margin
                printMedia  : false,       // Defaults to false. Force the use of a print stylesheet.
                maxErrors   : 3,           // Number errors phantom process is allowed to throw before killing it. Defaults to 3.
                expects     : true, // No default. Do not render until window.renderable is set to 'something'
                retries     : 2,           // How many times to try a render before giving up. Defaults to 1.
                phantomFlags: [], // Defaults to []. Command line flags passed to phantomjs
                maxRenders  : 20,          // How many renders can a phantom process make before being restarted. Defaults to 20
            };

            var render = phantom(options);

            var url = req.protocol + '://' + req.get('host') + "/#/" + (req.query.full == "true" ? "full" : "profile") + "/" + p._id;

            var cookies = [{
                    'name'     : 'token',   /* required property */
                    'value'    : full.token,  /* required property */
                    'domain'   : req.hostname,
                    'path'     : '/',                /* required property */
                    'httponly' : false,
                    'secure'   : false,
                    'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
                },
                {
                    'name'     : 'Graphs',   /* required property */
                    'value'    : req.query.Graphs,  /* required property */
                    'domain'   : req.hostname,
                    'path'     : '/',                /* required property */
                    'httponly' : false,
                    'secure'   : false,
                    'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
                },
                {
                    'name'     : 'selectedStartDate',   /* required property */
                    'value'    : req.query.selectedStartDate,  /* required property */
                    'domain'   : req.hostname,
                    'path'     : '/',                /* required property */
                    'httponly' : false,
                    'secure'   : false,
                    'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
                },
                {
                    'name'     : 'selectedEndDate',   /* required property */
                    'value'    : req.query.selectedEndDate,  /* required property */
                    'domain'   : req.hostname,
                    'path'     : '/',                /* required property */
                    'httponly' : false,
                    'secure'   : false,
                    'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
                },
                {
                    'name'     : 'selectedRange',   /* required property */
                    'value'    : req.query.selectedRange,  /* required property */
                    'domain'   : req.hostname,
                    'path'     : '/',                /* required property */
                    'httponly' : false,
                    'secure'   : false,
                    'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
                }
            ];

            //console.log('Pdf: ' + url);
            //console.log(cookies);

            res.setHeader("content-type", "application/pdf");
            res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);

            options.cookies = cookies;
            var r = render(url, options).pipe(res);

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