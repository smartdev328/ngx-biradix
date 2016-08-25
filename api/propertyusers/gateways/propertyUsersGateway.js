'use strict';
var AccessService =  require('../../access/services/accessService')
var PropertyUsersService =  require('../services/propertyUsersService')
var express = require('express');
var routes = express.Router();
var async = require("async");
var _ = require("lodash");

routes.get('/reminders_test', function (req, res) {
    PropertyUsersService.getPropertiesForReminders(req.user,function(properties) {

        async.eachLimit(properties,2, function(property, callbackp) {
                var email = {
                    to: '<eugene@biradix.com>',
                    logo: property.logo,
                    subject: "Property update reminder",
                    template: 'reminder.html',
                    templateData: {
                        data: property,
                        unsub: property.unsub,
                        dashboardBase: property.dashboardBase
                    }

                }

                // var BizEmailService = require('../../business/services/emailService')
                //
                // BizEmailService.send(email, function (emailError, status) {
                //
                //     if (emailError) {
                //         throw Error(emailError)
                //     }
                    
                    setTimeout(callbackp,1000);

                //})
        }, function(err) {
            
        }
        );


        res.status(200).json(properties);
    })

});

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

routes.put('/properties/:userid', function (req, res) {
    //AccessService.canAccessResource(req.user,req.params.userid,'UserManage', function(canAccess) {
    //    if (!canAccess) {
    //        return res.status(401).json("Unauthorized request");
    //    }

        PropertyUsersService.setPropertiesForUser(req.user,req.context, null, req.params.userid, req.body, function (err) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    //})
});

routes.get('/users/:propertyid', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.propertyid,'PropertyManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyUsersService.getPropertyAssignedUsers(req.user,  req.params.propertyid, function (err, users) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true, users: users});
            }
        });
    })
});

routes.put('/users/:propertyid', function (req, res) {
    AccessService.canAccessResource(req.user,req.params.propertyid,'PropertyManage', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyUsersService.setUsersForProperty(req.user, req.context, null, req.params.propertyid, req.body, function (err) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
});

module.exports = routes;
