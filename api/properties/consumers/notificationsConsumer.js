var bus = require("../../../config/queues")
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');
var propertyService = require('../services/propertyService');
var async = require("async");
var _ = require("lodash");
var moment = require("moment-timezone");
var moment = require("moment-timezone");
var redisService = require('../../utilities/services/redisService')
var BizEmailService = require('../../business/services/emailService')
var error = require('../../../config/error')

bus.handleQuery(settings.NOTIFICATIONS_QUEUE, function(data,reply) {
    console.log(data.properties, " notifications started");
    async.parallel({
        properties: function(callbackp) {
            const criteria = {
                select:"_id name",
                limit: 200,
                permission: 'PropertyManage',
                active: true
                , skipAmenities: true
                , hideCustom: true
            }

            if (data.properties && data.properties.length > 0 && data.properties[0] != null) {
                criteria.ids = data.properties;
            }

            propertyService.search(data.user, criteria, function(err,props) {
                callbackp(err, _.pluck(props,"_id"));
            });
        },
    }, function(err, all) {
        if (all.properties.length > 0) {
            let final = [];
            async.eachLimit(all.properties, 20, function(id, callbackp){

                const key = "nots-" + id;

                const hasSort = data.options && data.options.orderBy;

                redisService.get(key, function(err, result) {
                    if (result && settings.HEROKU_APP == "biradixplatform-prod" && !hasSort) {
                        // console.log('Cache:', result);
                        final.push(result);
                        callbackp(null);
                    } else {
                        queueService.getCompareReport(data.user, id, data.options, function (err, report) {
                            // console.log(id, report[0].name, report[0]._id)
                            if (!hasSort) {
                                redisService.set(key, report, 3 * 60); // 3 hours
                            }

                            // console.log('No Cache:', report);
                            final.push(report);

                            if (report == null) {
                                callbackp(err);
                            } else {
                                callbackp(null);
                            }
                        });
                    }
                });
            }, function(err) {
                if (err) {
                    error.send(JSON.stringify(err), {data: data, user: data.user});
                    reply({done: true});
                    return;
                }

                if (final.length > 0) {
                    // console.log(final);
                    var logo ='https://' + data.user.orgs[0].subdomain + ".biradix.com/images/organizations/" + data.user.orgs[0].logoBig;
                    var unsub ='https://' + data.user.orgs[0].subdomain + ".biradix.com/u";
                    var dashboardBase ='https://' + data.user.orgs[0].subdomain + ".biradix.com/d/";

                    var cron = data.user.settings.notifications.cron.split(" ");

                    var when = "weekly";

                    if (cron[4] == "*") {
                        when = "monthly";
                    }

                    // console.log(final);

                    var tz = data.user.settings.tz || 'America/Los_Angeles';

                    final.forEach(function(x) {
                        x.forEach(function(y)
                        {
                            if (y.date) {
                                //console.log(y.date);
                                y.date = moment(y.date.toString()).tz(tz).format("MMM DD")
                                //console.log(tz,y.date);
                            }

                            if (typeof y.lastmonthnersqftpercent == "undefined") {
                                y.lastmonthnersqftpercent = "";
                            }

                            if (typeof y.lastweeknersqftpercent == "undefined") {
                                y.lastweeknersqftpercent = "";
                            }

                            if (typeof y.lastyearnersqftpercent == "undefined") {
                                y.lastyearnersqftpercent = "";
                            }

                            if (typeof y.lastmonthnerpercent == "undefined") {
                                y.lastmonthnerpercent = "";
                            }

                            if (typeof y.lastweeknerpercent == "undefined") {
                                y.lastweeknerpercent = "";
                            }

                            if (typeof y.lastyearnerpercent == "undefined") {
                                y.lastyearnerpercent = "";
                            }                            

                            if (typeof y.nervscompavg == "undefined" || y.nervscompavg == null) {
                                y.nervscompavg = "";
                            }
                        })
                    })

                    //sort the list by subject alphabetically;
                    final = _.sortBy(final, function(x) {
                        return x[0].name.toLowerCase();
                    });

                    var email = {
                        category: "Property Status Update",
                        to: data.user.email,
                        //to: "eugene@biradix.com,alex@biradix.com",
                        width: 1000,
                        logo: logo,
                        subject: "Property Status Update",
                        template: 'notification.html',
                        templateData: {
                            first: data.user.first,
                            data: final,
                            unsub: unsub,
                            when: when,
                            showLeases: data.showLeases,
                            show: data.notification_columns,
                            dashboardBase : dashboardBase
                        }

                    }


                    if (data.dontEmail) {
                        reply({done: true, data: final});
                    } else {
                        BizEmailService.send(email, function (emailError, status) {

                            console.log("NOTS: (send status)", status);

                            reply({done: true});
                        })
                    }

                    final = null;
                    email = null;
                }

            });

        } else {
            reply({done: true});
        }

        all = null;

    });
});
