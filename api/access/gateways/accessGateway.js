'use strict';
var AccessService =  require('../services/accessService')
var express = require('express');
var routes = express.Router();
var async = require("async");
var _ = require("lodash");

routes.get("/roles", function(req, res) {
    async.parallel({
        allowedRoles: function(callbackp) {
            AccessService.getPermissions(req.user,['RoleAssign'],function(obj) {
                callbackp(null, obj)
            })
        },
        allRoles: function(callbackp) {
            AccessService.getOrgRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO','Guest']}, callbackp)
        }
    },function(err, all) {

        if (req.user.memberships && req.user.memberships.isadmin === true) {
            all.allowedRoles = _.map(all.allRoles, function(x) {return x._id.toString()});
        }
        var response = [];

        //Get all Allowed Role resource ids
        // Join on actual role to get name
        var role
        all.allowedRoles.forEach(function(al) {
            role = _.find(all.allRoles, function(x) {return x._id.toString() == al.toString()});
            role = JSON.parse(JSON.stringify(role));
            role.org = role.org.name;
            response.push(role);
        })

        response = _.sortByAll(response, ["org","name"])

        res.status(200).json(response);
    })

})
module.exports = routes;
