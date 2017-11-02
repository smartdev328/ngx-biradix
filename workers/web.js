//var moment = require("moment");
//var end = moment("5/3/2016 3:00").subtract(4,"weeks").endOf("week").add(1,"day").utcOffset(-480);
//var start = moment("5/3/2016 3:00").subtract(5,"weeks").startOf("week").add(1,"day").utcOffset(-480);
//console.log(start.format(),end.format());
//process.exit();
//return;
require ('newrelic');
var jwt = require('jsonwebtoken');
var settings = require('../config/settings')
var errors = require("../config/error")
var userService = require("../api/users/services/userService");
var propertyService = require("../api/properties/services/propertyService");

var d= require("domain").create();

d.on("error", function(err) {
    console.log(err.stack);
    console.log(d.context);
    if (settings.MODE == "production") {
        errors.send(err.stack,d.context);
    }
});

d.run(function() {

    require('../config/cluster').init({maxThreads: 1}, function (workerId) {
        var express = require('express')
        var app = express()
        var mongoose = require('mongoose');
        var queues = require("../config/queues")

        var connectedCount = 0;

        queues.connect(function () {
            connectedCount++;
            ready();
        })

        mongoose.Promise = global.Promise;
        mongoose.connect(settings.MONGODB_URI, {useMongoClient: true, poolSize: settings.MONGODB_POOL_SIZE});
        var conn = mongoose.connection;

        conn.once('open', function () {
            console.log({type: 'info', msg: 'connected', service: 'mongodb'});
            connectedCount++;
            ready();
        });

        function ready() {
            if (connectedCount < 2) {
                return;
            }
            require('../config/express').init(app, d)
            app.use('/poc/', require('../poc/pocGateway'));
            app.use('/', require('../site/siteroutes'));
            app.use(settings.API_PATH + 'access/', require('../api/access/gateways/accessGateway'));
            app.use(settings.API_PATH + 'users/', require('../api/users/gateways/userGateway'));
            app.use(settings.API_PATH + 'properties/', require('../api/properties/gateways/propertyGateway'));
            app.use(settings.API_PATH + 'propertyusers/', require('../api/propertyusers/gateways/propertyUsersGateway'));
            app.use(settings.API_PATH + 'propertyamenities/', require('../api/propertyamenities/gateways/propertyAmenityGateway'));
            app.use(settings.API_PATH + 'audit/', require('../api/audit/gateways/auditGateway'));
            app.use(settings.API_PATH + 'amenities/', require('../api/amenities/gateways/amenitiesGateway'));
            app.use(settings.API_PATH + 'organizations/', require('../api/organizations/gateways/organizationsGateway'));
            app.use(settings.API_PATH + 'reporting/', require('../api/reporting/gateways/reportingGateway'));
            app.use(settings.API_PATH + 'reporting/save/', require('../api/reporting/gateways/saveReportGateway'));
            app.use('/contact', require('../api/contact/gateways/contactGateway'));
            app.use('/progress', require('../api/progress/gateways/progressGateway'));
            app.use('/status', require('../api/status/gateways/statusGateway'));
            app.use('/properties/cron', require('../api/properties/gateways/cronGateway'));
            app.use('/propertyusers/cron', require('../api/propertyusers/gateways/cronGateway'));

            app.use('/url', require('../api/urlshortener/gateways/urlGateway'));

            app.get('/p/:token', function (req, res) {
                res.redirect('/#/password/reset/' + req.params.token)
            })

            app.get('/g/:propertyid/:token', function (req, res) {
                jwt.verify(req.params.token, settings.SECRET, function(err, decoded) {
                    if (err) {
                           userService.getSystemUser(function (system) {
                               propertyService.search(system.user,{_id: req.params.propertyid}, function(err, props) {
                                   res.cookie('token', "");
                                   res.cookie('tokenDate', "");

                                   if (props && props.length == 1) {
                                       res.redirect('/#/expired?name=' + encodeURIComponent(props[0].name));
                                   } else {
                                       res.redirect('/#/login');
                                   }

                               })
                           })
                    }
                    else {
                        res.cookie('token', req.params.token);
                        res.cookie('tokenDate', "");
                        res.redirect('/#/dashboard2?id=' + req.params.propertyid)
                    }
                });
            })

            require('../api/status/consumers/webConsumer')

            if (settings.RUN_DASHBOARD == "web") {
                require('../api/properties/consumers/dashboardConsumer');
                require('../api/properties/consumers/historyCompareConsumer');
                require('../api/properties/consumers/notificationsConsumer');
                require('../api/propertyusers/consumers/guestsConsumer');
            }

            if (settings.RUN_PHANTOM == "web") {
                require('../api/properties/consumers/pdfConsumer')
                require('../api/status/consumers/phantomConsumer')
                require('../config/pdfHitCount');
            }

            var server = app.listen(settings.PORT, function () {
                console.log('WorkerID: %s, Port: %s', workerId, server.address().port);

                //var moment = require('moment-timezone');
                //console.log(moment("2015-11-08T18:07:52.005Z").tz("America/Los_Angeles").format("MMM DD"));
                //var userService = require("../api/users/services/userService");
                //userService.getUsersForNotifications(function(err,users) {
                //    console.log(users);
                //});

                //var cronService = require("../api/utilities/services/cronService");
                //cronService.isAllowed("* * * * 2");

//console.log(parseFloat("55678.42342").toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
                if (workerId == 1) {

                    setTimeout(function() {
                        require('../config/seed').init();
                    }, 30000)

                //    var moment = require("moment");
                //    var end = moment().add(-1,"day").startOf('week').add(1,"day").utcOffset(-480);
                //    var start = moment(end).add(-7,"day")
                //    console.log(start.format(), end.format());
                //
                //    var end1 = moment().add(-1,"month").endOf('month').utcOffset(-480);
                //    var start1 = moment().add(-1,"month").startOf('month').utcOffset(-480);
                //    console.log(start1.format(), end1.format());
                //}

                //if (workerId == 1) {
                //    var userService = require("../api/users/services/userService");
                //    userService.getSystemUser(function (user) {
                //        var queueService = require('../api/properties/services/queueService');
                //
                //        queueService.sendNotification(user.user, ["5642bae5ff18a018187b2c5c","5642bab9ff18a018187b07fb"], function() {
                //        })
                //

                    // var PropertyAmenityService = require("../api/propertyamenities/services/propertyAmenityService");
                    // var userService = require("../api/users/services/userService");
                    // userService.getSystemUser(function (obj) {
                    //     var SystemUser = obj.user;
                    //     PropertyAmenityService.deleteAmenity(SystemUser,{},null,"5642ba20ff18a018187afdae", function(errors) {
                    //         console.log(errors);
                    //     })
                    // });

                    // var userService = require("../api/users/services/userBounceService");
                    //
                    // userService.resetBounce("bjones@viderman.com", function(err,response) {
                    //     console.log(err,response.statusCode);
                    // })

                    // var propertyUserService = require("../api/propertyusers/services/propertyUsersService")
                    // propertyUserService.updateGuestPermissionsForProperty("5876f78dc63f6f03c0a96840", function() {
                    //     console.log('Done 1');
                    //     propertyUserService.updateGuestPermissionsForProperty("5876f78dc63f6f03c0a96841", function() {
                    //         console.log('Done 2');
                    //         propertyUserService.updateGuestPermissionsForProperty("5876f78dc63f6f03c0a9683d", function() {
                    //             console.log('Done 3');
                    //         });
                    //     });
                    // });

                    // var userService = require("../api/users/services/userService");
                    // userService.getSystemUser(function (obj) {
                    //     var SystemUser = obj.user;
                    //
                    //     userService.search(SystemUser, {}, function(err, users) {
                    //         //console.log(users);
                    //     })
                    // });
                }



            })
        };


    });

});