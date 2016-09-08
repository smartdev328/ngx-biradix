'use strict';
var PropertyUsersService =  require('../services/propertyUsersService')
var express = require('express');
var routes = express.Router();
var async = require("async");
var _ = require("lodash");
var userService = require("../../users/services/userService");
var moment = require("moment-timezone");
var redisService = require('../../utilities/services/redisService')

routes.get('/reminders_test', function(req, res) {
    userService.getSystemUser(function(obj) {
        var SystemUser = obj.user;
        PropertyUsersService.getPropertiesForReminders(SystemUser,function(properties) {

            return res.status(200).json(properties);
        })
    })
})

routes.get('/reminders', function (req, res) {

    var key = "reminders_Sent";
    var dayofweek = moment().tz('America/Los_Angeles').format("dd");

    if (dayofweek != 'Th') {
        return res.status(200).json(dayofweek +': Can only run this on Thursday');
    }

    redisService.get(key, function(err, alreadysent) {

        if (alreadysent) {
            return res.status(200).json(dayofweek +': Already Sent');
        }

        redisService.set(key, "1", 60 * 24);

        res.status(200).json(dayofweek +': Queued');

        userService.getSystemUser(function(obj) {
            var SystemUser = obj.user;
            PropertyUsersService.getPropertiesForReminders(SystemUser,function(properties) {

                async.eachLimit(properties,2, function(property, callbackp) {
                        var email = {
                            to: property.user.email,
                            bcc: '<cue@biradix.com>',
                            logo: property.logo,
                            subject: "Property update reminder",
                            template: 'reminder.html',
                            templateData: {
                                data: property,
                                unsub: property.unsub,
                                dashboardBase: property.dashboardBase
                            }

                        }

                        // setTimeout(callbackp,1000);

                        var BizEmailService = require('../../business/services/emailService')

                        BizEmailService.send(email, function (emailError, status) {

                            if (emailError) {
                                throw Error(emailError)
                            }

                            setTimeout(callbackp,1000);

                        })
                    }, function(err) {

                    }
                );

            })
        })

    })



});
module.exports = routes;
