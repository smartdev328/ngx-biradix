'use strict';
var express = require('express');
var moment = require('moment');
var async = require("async");
var _ = require("lodash")
var Routes = express.Router();
/////////////////////////////////
var userService = require('../../users/services/userService')
var queueService = require('../services/queueService');
var exportService = require('../services/exportService');
var EmailService = require('../../business/services/emailService')
var redisService = require('../../utilities/services/redisService')

Routes.get('/test', function (req, res) {
    userService.getUsersForNotifications(true, function (err, users) {
        res.status(200).json({queued: users.length})
        console.log('NOTS: ', {queued: users.length});

        async.eachLimit(users, 10, function (user, callbackp) {
            userService.getFullUser(user, function(full) {
                if (full.operator.roles[0] != 'Guest') {
                    queueService.sendNotification(full.operator, {
                        properties: full.operator.settings.notifications.props,
                        showLeases: full.operator.settings.showLeases,
                        notification_columns: full.operator.settings.notification_columns,
                        dontEmail: true
                    }, function () {
                        callbackp()
                    })
                } else {
                    callbackp()
                }
            });
        }, function (err) {

        });

    });
});

Routes.get('/notifications', function (req, res) {
    userService.getUsersForNotifications(false, function (err, users) {
        res.status(200).json({queued: users.length})

        async.eachLimit(users, 10, function (user, callbackp) {
            userService.getFullUser(user, function(full) {
                full.operator.settings.notifications.last = new Date();
                userService.updateSettings(full.operator, full.operator, full.operator.settings, {ip: '127.0.0.1', user_agent: 'server'}, function () {
                    if (full.operator.roles[0] != 'Guest') {
                        queueService.sendNotification(full.operator, {
                            properties: full.operator.settings.notifications.props,
                            showLeases: full.operator.settings.showLeases,
                            notification_columns: full.operator.settings.notification_columns
                        }, function () {
                            callbackp()
                        })
                    } else {
                        callbackp()
                    }

                });
            })

        }, function (err) {

        });

    });
});

// Routes.get('/export_wood_lifetime', function (req, res) {
//     let key = "export_wood_lifetime2";
//
//     redisService.get(key, (err, alreadysent) => {
//
//         if (alreadysent) {
//             return res.status(200).json('Already Sent');
//         }
//
//         redisService.set(key, "1", 60 * 24 * 100);
//
//         let dates = [];
//         let dates_sent = [];
//
//         let date1 = moment().tz('America/Los_Angeles').startOf("year").subtract(1, "year");
//
//         while (date1.day() !== 1) {
//             date1.add(1, 'day');
//         }
//
//         while (date1.format("x") < moment().format("x")) {
//             dates.push(date1.format());
//             date1.add(7, 'day');
//         }
//
//         res.status(200).json(dates_sent);
//
//         userService.getSystemUser(System => {
//             let SystemUser = System.user;
//
//             async.eachLimit(dates, 1, (date, callbackp) => {
//                 let number_rows = 0;
//
//                 exportService.getCsv(SystemUser, 'wood', date, string => {
//                     number_rows = string.trim().split('\r\n').length;
//                     //Do not send empty files
//                     if (number_rows > 1) {
//                         var friendly_date = moment(date).tz('America/Los_Angeles').add(-1, "day").format("MM_DD_YYYY");
//                         var email = {
//                             to: "BI_Radi.nvvrgyasj45hb348@u.box.com",
//                             bcc: "eugene@biradix.com",
//                             subject: 'BI:Radix - Wood Residential data export ' + friendly_date,
//                             logo: "https://wood.biradix.com/images/organizations/wood.png",
//                             template: 'export.html',
//                             templateData: {},
//                             attachments: [
//                                 {
//                                     filename: 'biradix_wood_export_' + friendly_date + '.csv',
//                                     content: string,
//                                     contentType: 'text/csv'
//                                 }
//                             ]
//
//                         };
//
//                         EmailService.send(email, (emailError, status) => {
//                             console.log('Wood export', emailError, status)
//                         })
//
//                         dates_sent.push(date);
//                     }
//                     callbackp();
//                 })
//             }, function (err) {
//
//             });
//         });
//     });
//
//
// });

Routes.get('/export', function (req, res) {
    let key = "export_wood_nightly";
    let dayofweek = moment().tz('America/Los_Angeles').format("dd");
    let hourOfDay = moment().tz('America/Los_Angeles').format("HH");

    if (dayofweek == 'Fr' || dayofweek == 'Sa' ) {
        return res.status(200).json(dayofweek +': Cannot run Fr nor Sa night');
    }

    if (hourOfDay != 23) {
        return res.status(200).json(`${hourOfDay}: Can only run at 11 pm`);
    }

    redisService.get(key, (err, alreadysent) => {

        if (alreadysent) {
            return res.status(200).json(dayofweek + ': Already Sent');
        }

        redisService.set(key, "1", 60 * 12);

        res.status(200).json(dayofweek +': Queued');

        userService.getSystemUser(System => {
            let SystemUser = System.user;
            exportService.getCsv(SystemUser, 'wood', null, string => {

                var email = {
                    to: "BI_Radi.nvvrgyasj45hb348@u.box.com",
                    bcc: "alex@biradix.com,eugene@biradix.com",
                    subject: 'BI:Radix - Wood Residential nightly data export',
                    logo: "https://wood.biradix.com/images/organizations/wood.png",
                    template: 'export.html',
                    templateData: {},
                    attachments: [
                        {
                            filename: 'biradix_wood_export.csv',
                            content: string,
                            contentType: 'text/csv'
                        }
                    ]

                };

                EmailService.send(email, (emailError, status) => {
                    console.log('Wood export', emailError, status)
                })


            })


        });
    });
});

module.exports = Routes;