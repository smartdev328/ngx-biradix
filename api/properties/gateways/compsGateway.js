var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var saveCompsService = require('../services/saveCompsService')
var CompService = require('../services/compsService')

module.exports = {
    init: function(Routes) {
        Routes.get("/:id/guestComps", function(req, res) {
            AccessService.canAccessResource(req.user, req.params.id, "PropertyManage", function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                CompService.getCompsForGuest(req.user._id, req.params.id, function(err, subjects) {
                    if (err) {
                        return res.status(200).json({comps: null, errors: err});
                    }
                    else {
                        return res.status(200).json({comps: subjects});
                    }
                });
            });
        });

        Routes.get('/:id/subjects', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                CompService.getSubjects([req.params.id], {select: "_id name survey.date"}, function (err, subjects) {
                    if (err) {
                        return res.status(200).json({subjects: null, errors: err});
                    }
                    else {
                        return res.status(200).json({subjects: subjects});
                    }
                });
            })
        })

        Routes.put('/:id/comps/:compid', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.linkComp(req.user, req.context, null, req.params.id, req.params.compid, function (err, newusr) {
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

                PropertyService.unlinkComp(req.user, req.context, null, req.params.id, req.params.compid, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })

        Routes.post('/:id/comps/saveOrder', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                req.body.compids = req.body.compids || [];

                saveCompsService.saveComps(req.user,req.context,req.params.id,req.body.compids, function() {
                    return res.status(200).json({success: true});
                })
            })
        })

        Routes.post('/:id/comps/:compid', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.saveCompLink(req.user, req.context, null, req.params.id, req.params.compid, req.body.floorplans, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })


    }
}