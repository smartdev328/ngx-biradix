'use strict';

var express = require('express');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var UtilityService=  require('../services/utilityService')
var UserService=  require('../services/userService')
var AccessService = require('../../access/services/accessService')
var settings = require('../../../config/settings')

var userRoutes = express.Router();


userRoutes.post('/login', function (req, res) {
   var user =  {}
    user.email = req.body.email;
    user.password = req.body.password;

    UserService.login(user, function(usr) {

            AccessService.getMemberships(usr._id,function(err,obj) {

                var usrobj = UtilityService.getPublicJSON(usr);
                usrobj.memberships = obj;
                usrobj.useragent = req.headers['user-agent'];
                usrobj.ip = req.connection.remoteAddress;

                AccessService.getPermissions(usrobj, ['View'], function(viewpermissions) {
                    usrobj.viewpermissions = viewpermissions;

                    AccessService.getAssignedRoles(usrobj._id, function(err, userroles) {
                        AccessService.getRoles(function (err, roles) {
                            userroles = JSON.parse(JSON.stringify(userroles))
                            var final = _.filter(roles, function(x) {
                                return userroles.indexOf(x._id.toString()) > -1
                            })
                            usrobj.roles = _.pluck(final,'name');
                            var token = jwt.sign(usrobj, settings.SECRET, {expiresInMinutes: 60 * 24 * 7});

                            res.status(200).json({token: token});
                        })
                    })

                })


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
