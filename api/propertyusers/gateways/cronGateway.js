"use strict";
const PropertyUsersService = require("../services/propertyUsersService");
const express = require("express");
const routes = new express.Router();
const async = require("async");
const userService = require("../../users/services/userService");
const moment = require("moment-timezone");
const redisService = require("../../utilities/services/redisService");

routes.get("/reminders_test", function(req, res) {
    userService.getSystemUser(function(obj) {
        let SystemUser = obj.user;
        PropertyUsersService.getPropertiesForReminders(SystemUser, function(properties) {
            return res.status(200).json(properties);
        });
    });
});

routes.get("/reminders", function(req, res) {
    let key = "reminders_sent_new2";
    let dayofweek = moment().tz("America/Los_Angeles").format("dd");

    if (dayofweek != "Th") {
        return res.status(200).json(dayofweek +": Can only run this on Thursday");
    }

    redisService.get(key, function(err, alreadysent) {
        if (alreadysent) {
            return res.status(200).json(dayofweek + ": Already Sent");
        }

        redisService.set(key, "1", 60 * 24);

        res.status(200).json(dayofweek + ": Queued");

        userService.getSystemUser(function(obj) {
            let SystemUser = obj.user;
            PropertyUsersService.getPropertiesForReminders(SystemUser, function(properties) {
                async.eachLimit(properties, 2, function(property, callbackp) {
                        let email = {
                            // to: "alex@biradix.com",
                            category: "Property Update Reminder",
                            to: property.user.email,
                            bcc: "<cue@biradix.com>",
                            logo: property.logo,
                            logoHeight: property.logoEmailHeight,
                            width: 700,
                            subject: "UPDATE REMINDER: Market Survey",
                            template: "reminder.html",
                            templateData: {
                                data: property,
                                unsub: property.unsub,
                                dashboardBase: property.dashboardBase,
                            },
                        };

                        // setTimeout(callbackp,1000);

                        let BizEmailService = require("../../business/services/emailService");

                        BizEmailService.send(email, function(emailError, status) {
                            console.log("REMINDER EMAIL: ", status);

                            if (emailError) {
                                throw Error(emailError);
                            }

                            setTimeout(callbackp, 1000);
                        });
                    }, function(err) {

                    }
                );
            });
        });
    });
});

module.exports = routes;
