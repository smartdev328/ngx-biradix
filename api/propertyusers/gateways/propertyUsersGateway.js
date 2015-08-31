'use strict';
var AccessService =  require('../../access/services/accessService')
var PropertyUsersService =  require('../services/propertyUsersService')
var express = require('express');
var routes = express.Router();
var async = require("async");
var _ = require("lodash");

routes.get('/properties/:userid', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.userid,'UserManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyUsersService.getUserAssignedProperties(req.user,  req.params.userid, function (err, properties) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true, properties: properties});
            }
        });
    })
});

module.exports = routes;
