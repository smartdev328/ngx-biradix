'use strict';

var express = require('express');
var AuditService = require('../services/auditService')
var AccessService = require('../../access/services/accessService')
var UserService = require('../../users/services/userService')
var PropertyService = require('../../properties/services/propertyService')
var Routes = express.Router();
var async = require('async')
var _ = require('lodash')

Routes.get('/filters', function (req, res) {
    async.parallel({
        users: function(callbackp) {
                UserService.search(req.user, {}, function(err,users) {
                    callbackp(null, users)
                })
        },

        properties: function(callbackp) {
            PropertyService.search(req.user, {permission: 'PropertyManage', select: '_id name comps.id'}, function(err,properties) {

                if (req.user.memberships.isadmin === true) {
                    callbackp(null, properties)
                } else {
                    var subjectandcompids = _.pluck(_.flatten(_.pluck(properties,'comps')),"id").concat(_.pluck(properties, "_id"));
                    PropertyService.search(req.user, {permission: 'PropertyView', select: '_id name', ids: subjectandcompids}, function(err,properties) {
                        callbackp(null, properties)
                    });
                }
            })
        },

    }, function(err, all) {
            return res.status(200).json({audits: AuditService.audits, users: all.users, properties: all.properties});
    })

});

Routes.post('/', function (req, res) {
    AccessService.canAccess(req.user,"History", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }


        async.parallel({
            userids: function(callbackp) {
                if (req.user.memberships.isadmin === true) {
                    callbackp(null,[]);
                } else {
                    UserService.search(req.user, {}, function(err,users) {
                        callbackp(null, _.pluck(users,"_id"))
                    });
                }
            },
        }, function(err, all) {
            AuditService.get(req.body,all.userids, function (err, obj, pager) {
                if (err) {
                    return res.status(200).json({errors: err});
                }

                return res.status(200).json({errors: null, activity: obj, pager: pager});
            });
        })



    })
});

Routes.put('/', function (req, res) {
    var audit = req.body;
    audit.operator = req.user;
    audit.context = req.context;
    AuditService.create(audit, function() {
        return res.status(200).json({success:true});
    })

});

module.exports = Routes;