'use strict';
var AccessService =  require('../services/accessService')
var OrgService =  require('../../organizations/services/organizationService')
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
            AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO','Guest'], cache: false}, callbackp)
        },
        orgs: function(callbackp) {
            OrgService.read(callbackp)
        }
    },function(err, all) {

        if (req.user.memberships && req.user.memberships.isadmin === true) {
            all.allowedRoles = _.map(all.allRoles, function(x) {return x._id.toString()});
        }
        var response = [];

        //Get all Allowed Role resource ids
        // Join on actual role to get name
        // Join on orgid to get orgname
        all.allowedRoles.forEach(function(al) {
            var role = _.find(all.allRoles, function(x) {return x._id.toString() == al.toString()});
            var org = _.find(all.orgs, function(x) {return x._id.toString() == role.orgid.toString()});

            role = JSON.parse(JSON.stringify(role));
            role.org = org.name;
            response.push(role);
        })

        response = _.sortByAll(response, ["org","name"])

        res.status(200).json(response);
    })

})
module.exports = routes;
