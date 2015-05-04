'use strict';
var AccessService =  require('../services/accessService')
var express = require('express');
var roleRoutes = express.Router();

roleRoutes.get("/roles", function(req, res) {
    AccessService.getRoles(function(err, obj) {
        if (err) {
            res.status(400).json(err);
        } else {
            res.status(200).json(obj);
        }
    })
})
roleRoutes.get("/roles/:userid", function(req, res) {
    AccessService.canAccess(req.user,"/access/manage", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }
        AccessService.getAssignedRoles(req.params.userid, function (err, obj) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.status(200).json(obj);
            }
        })
    })
})
roleRoutes.post('/roles/create', function (req, res) {

    AccessService.canAccess(req.user,"/access/manage", function(canAccess) {
            if (!canAccess) {
                return res.status(401).json("Unauthorized request");
            }


            var role = {name: req.body.name, parentid: req.body.parentid, isadmin: req.body.isadmin};

            AccessService.createRole(role,function(err,obj) {
                if (err) {
                    res.status(200).json(err);
                } else {
                    res.status(201).json(obj);
                }
            });

        }
    )

})

roleRoutes.post('/roles/:id/members/create', function (req, res) {
    AccessService.canAccess(req.user,"/access/manage", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        var member = {userid: req.body.userid, roleid: req.params.id};

        AccessService.assignMembership(member, function (err, obj) {
            if (err) {
                res.status(200).json(err);
            } else {
                res.status(201).json(obj);
            }
        });
    })
})

roleRoutes.post('/roles/:id/members/revoke', function (req, res) {
    AccessService.canAccess(req.user,"/access/manage", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        var member = {userid: req.body.userid, roleid: req.params.id};

        AccessService.revokeMembership(member, function (err, obj) {
            if (err) {
                res.status(200).json(err);
            } else {
                res.status(201).json(null);
            }
        });
    })
})

roleRoutes.post('/permissions/:executorid/create', function (req, res) {
    AccessService.canAccess(req.user,"/access/manage", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        var permissions = {};
        permissions.resource = req.body.resource;
        permissions.action = req.body.action;
        permissions.executorid = req.params.executorid;
        permissions.allow = req.body.allow;

        AccessService.createPermission(permissions, function (err, obj) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.status(201).json(obj);
            }
        });
    })
})

module.exports = roleRoutes;
