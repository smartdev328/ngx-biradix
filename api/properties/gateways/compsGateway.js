var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')

module.exports = {
    init: function(Routes) {
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