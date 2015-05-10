'use strict';

var express = require('express');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var UtilityService=  require('../services/utilityService')
var UserService=  require('../services/userService')
var AccessService = require('../../access/services/accessService')
var OrgService = require('../../organizations/services/organizationService')
var settings = require('../../../config/settings')
var async = require('async')


var userRoutes = express.Router();


userRoutes.post('/login', function (req, res) {
   var user =  {}
    user.email = req.body.email;
    user.password = req.body.password;

    UserService.login(user, function(usr) {
            var usrobj = UtilityService.getPublicJSON(usr);
            async.parallel({
                    memberships: function(callbackp) {
                        AccessService.getMemberships(usr._id,function(err,memberships) {
                            callbackp(null, memberships)
                        });
                    },
                    viewpermissions: function(callbackp) {
                        AccessService.getPermissions(usrobj, ['View'], function(viewpermissions) {
                            callbackp(null, viewpermissions)
                        });
                    },
                    userroles: function(callbackp) {
                        AccessService.getAssignedRoles(usrobj._id, function(err, userroles) {
                            userroles = JSON.parse(JSON.stringify(userroles))
                            callbackp(null, userroles)
                        });
                    },
                    roles: function(callbackp) {
                        AccessService.getRoles(function (err, roles) {
                            callbackp(null, roles)
                        });
                    },
                    orgs: function(callbackp) {
                        OrgService.read(function (err, orgs) {
                            callbackp(null, orgs)
                        });
                    }
                }
                ,function(err, all) {
                    delete usrobj.date;
                    delete usrobj.__v;
                    usrobj.memberships = all.memberships;
                    //usrobj.useragent = req.headers['user-agent'];
                    //usrobj.ip = req.connection.remoteAddress;

                    usrobj.viewpermissions = all.viewpermissions;

                    var final = _.filter(all.roles, function(x) {
                        return all.userroles.indexOf(x._id.toString()) > -1
                    })
                    usrobj.roles = _.pluck(final,'name');

                    if (final.length > 0) {
                        usrobj.org = _.find(all.orgs, function(x) {
                            return final[0].orgid.toString() == x._id.toString();
                        })
                    }
                    //TODO: Global Path to org images

                    var token = jwt.sign(usrobj, settings.SECRET, {expiresInMinutes: 60 * 24 * 7});

                    res.status(200).json({token: token});
                })
        },
        function(errors) {
            res.status(200).json(errors);
        }
    );
})

userRoutes.get('/me', function (req, res) {
    delete req.user.memberships;
    delete req.user.ip;
    delete req.user.useragent;
    res.status(200).json(req.user);
})

userRoutes.post('/create', function (req, res) {
    UserService.insert(req.body, function (usr) {
            res.status(201).json({errors: null, user: UtilityService.getPublicJSON(usr)});
        },
        function (errors) {
            res.status(200).json({errors: errors, user: null});
        }
    );
});



module.exports = userRoutes;
