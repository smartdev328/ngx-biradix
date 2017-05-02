'use strict';
var express = require('express');
var async = require("async");
var _ = require("lodash")
var Routes = express.Router();
/////////////////////////////////
var userService = require('../../users/services/userService')
var queueService = require('../services/queueService');
var exportService = require('../services/exportService');
var EmailService = require('../../business/services/emailService')

// Routes.get('/test', function (req, res) {
//     userService.getUsersForNotifications(function (err, users) {
//         res.status(200).json({users: users})
//
//     });
// });

Routes.get('/notifications', function (req, res) {
    userService.getUsersForNotifications(function (err, users) {
        async.eachLimit(users, 10, function (user, callbackp) {
            userService.getFullUser(user, function(full) {
                full.operator.settings.notifications.last = new Date();
                userService.updateSettings(full.operator, full.operator, full.operator.settings, {ip: '127.0.0.1', user_agent: 'server'}, function () {
                    if (full.operator.roles[0] != 'Guest') {
                        queueService.sendNotification(full.operator, {
                            properties: full.operator.settings.notifications.props,
                            showLeases: full.operator.settings.showLeases
                        }, function () {
                        })
                    }
                    callbackp()
                });
            })

        }, function (err) {
            res.status(200).json({queued: users.length})
        });

    });
});

Routes.get('/export', function (req, res) {
    userService.getSystemUser(function (System) {
        var SystemUser = System.user;
        exportService.getCsv(SystemUser, 'wood', function(string) {

            var email = {
                to: "alex@biradix.com,eugene@biradix.com",
                subject: 'BI:Radix - Wood Residential nightly data export',
                logo : "https://wood.biradix.com/images/organizations/wood.png",
                template : 'export.html',
                templateData : { },
                attachments: [
                    {
                        filename: 'biradix_wood_export.csv',
                        content: string,
                        contentType: 'text/csv'
                    }
                ]

            };

            EmailService.send(email,function(emailError,status) {
                res.status(200).json({emailError: emailError, status: status})
            })


        })


    });
});

module.exports = Routes;