var queues = require("../../../config/queues")
var settings = require("../../../config/settings")
var queueService = require('../services/queueService');
var propertyService = require('../services/propertyService');
var async = require("async");
var _ = require("lodash");
var moment = require("moment-timezone");
var redisService = require('../../utilities/services/redisService')
var BizEmailService = require('../../business/services/emailService')

queues.getNotificationsQueue().consume(function(data,reply) {
    async.parallel({
        properties : function(callbackp) {
            if (data.properties && data.properties.length > 0) {
                callbackp(null,data.properties);
            } else {
                propertyService.search(data.user, {
                    select:"_id name",
                    limit: 1000,
                    permission: 'PropertyManage',
                    active: true
                }, function(err,props) {
                    callbackp(err, _.pluck(props,"_id"));
                })

            }
        }
    }, function(err, all) {

        if (all.properties.length > 0) {
            var final = [];
            async.eachLimit(all.properties, 20, function(id, callbackp){

                var key = "not-" + id;

                redisService.get(key, function(err, result) {
                    if (result && settings.HEROKU_APP == "biradixplatform-prod") {
                        //console.log('Cache:', result);
                        final.push(result);
                        callbackp(null)
                    }
                    else {
                        queueService.getCompareReport(data.user, id, function (err, report) {
                            //console.log(id, report[0].name, report[0]._id)
                            redisService.set(key, report, 3 * 60); // 3 hours
                            //console.log('No Cache:', report);
                            final.push(report);
                            callbackp(null)
                        })
                    }
                });



            }, function(err) {
                //return reply({done: true});

                if (final.length > 0) {
                    //console.log(final);
                    var logo ='https://' + data.user.org.subdomain + ".biradix.com/images/organizations/" + data.user.org.logoBig;
                    var unsub ='https://' + data.user.org.subdomain + ".biradix.com/u";

                    var cron = data.user.settings.notifications.cron.split(" ");

                    var when = "weekly";

                    if (cron[4] == "*") {
                        when = "monthly";
                    }

                    //console.log(final);

                    var tz = data.user.settings.tz || 'America/Los_Angeles';

                    final.forEach(function(x) {
                        x.forEach(function(y)
                        {
                            if (y.date) {
                                console.log(y.date);
                                y.date = moment(y.date.toString()).tz(tz).format("MMM DD")
                                console.log(tz,y.date);
                            }

                            if (typeof y.lastmonthnersqftpercent == "undefined") {
                                y.lastmonthnersqftpercent = "";
                            }

                            if (typeof y.lastweeknersqftpercent == "undefined") {
                                y.lastweeknersqftpercent = "";
                            }
                        })
                    })

                    var email = {
                        to: data.user.email,
                        //to: "eugene@biradix.com,alex@biradix.com",
                        logo: logo,
                        subject: "Property Status Update",
                        template: 'notification.html',
                        templateData: {
                            first: data.user.first,
                            data: final,
                            unsub: unsub,
                            when: when,
                            showLeases: data.showLeases
                        }

                    }

                    BizEmailService.send(email, function(emailError, status) {

                        if (emailError) {
                            throw Error(emailError)
                        }

                        reply({done: true});
                    })

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

queues.attachQListeners(queues.getNotificationsQueue(), "Notifications Compare");


