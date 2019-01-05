require("newrelic");
const jwt = require("jsonwebtoken");
const settings = require("../config/settings");
const errors = require("../config/error");
const container = require("../config/container");

let d = require("domain").create();

d.on("error", function(err) {
    console.log(err.stack);
    console.log(d.context);
    if (settings.MODE == "production") {
        errors.send(err.stack, d.context);
    }
});

d.run(function() {
    require('../config/cluster').init({maxThreads: 1}, function(workerId) {
        var express = require('express')
        var app = express()
        var mongoose = require('mongoose');
        var queues = require("../config/queues")

        var connectedCount = 0;

        queues.connect(function() {
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

        container.init(function() {
            connectedCount++;
            ready();
        });

        function ready() {
            console.log("connectedCount: ", connectedCount)
            if (connectedCount < 3) {
                return;
            }
            const graphqlHTTP = require("express-graphql");
            let {HeartbeatSchema} = require("../build/services/gateway/HeartbeatSchema");
            let {RootSchema} = require("../build/services/gateway/RootSchema");

            require("../config/express").init(app, d)
            app.use("/health/graphql", graphqlHTTP({
                schema: HeartbeatSchema,
                graphiql: false,
            }));
            app.use("/health/graphqli", graphqlHTTP({
                schema: HeartbeatSchema,
                graphiql: true,
            }));

            app.use("/graphqli", graphqlHTTP({
                schema: RootSchema,
                graphiql: true,
            }));

            app.post("/graphql", graphqlHTTP({
                schema: RootSchema,
                graphiql: false,
            }));

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
            app.use(settings.API_PATH + 'media/images/', require('../api/media/gateways/imagesGateway'));
            app.use(settings.API_PATH + 'keen/', require("../build/keen/gateways/keenGateway"));
            app.use('/contact', require('../api/contact/gateways/contactGateway'));
            app.use('/progress', require('../api/progress/gateways/progressGateway'));
            app.use('/status', require('../api/status/gateways/statusGateway'));
            app.use('/properties/cron', require('../api/properties/gateways/cronGateway'));
            app.use('/propertyusers/cron', require('../api/propertyusers/gateways/cronGateway'));
            app.use("/propertyusers/keen", require("../build/propertyusers/gateways/keenGateway"));
            app.use("/properties/keen", require("../build/properties/gateways/keenGateway"));
            app.use("/users/cron", require("../build/users/gateways/cronGateway"));
            app.use("/ftp", require("../build/ftp/gateways/ftpGateway"));
            app.use("/reporting/alliancecron", require("../build/reporting/gateways/allianceCronGateway"));

            app.get('/p/:token', function (req, res) {
                res.redirect('/#/password/reset/' + req.params.token);
            })

            app.get('/g/:propertyid/:token', function (req, res) {
                jwt.verify(req.params.token, settings.SECRET, function(err, decoded) {
                    if (err) {
                        res.redirect('/#/expired');
                    } else {
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
                require('../api/properties/consumers/pdfConsumer')
            }

            var server = app.listen(settings.PORT, function () {
                console.log('WorkerID: %s, Port: %s', workerId, server.address().port);

                // const s = require("../build/approvedlists/service/ApprovedListsService");
                // s.remove(null, null, "1st Lake Properties", "OWNER");
                // s.create(null, null, {value: "test4", type: "Owner"}).then((w) => {

                //     console.log(w);
                //     s.read({type: "Owner", activeOnly: true}).then((x) => {
                //         console.log(x);
                //     });
                // });

                // const WalkScore = require("../build/walkscore/services/walkScoreService");
                // WalkScore.WalkScoreService.getScore("4949 N 7th Ave, Phoenix, AZ 85013", 33.508710, -112.082400).then((w) => {
                //    console.log(w);
                // }).catch((er) => {
                //     console.log(er);
                // });
                //var moment = require('moment-timezone');
                //console.log(moment("2015-11-08T18:07:52.005Z").tz("America/Los_Angeles").format("MMM DD"));
                //var userService = require("../api/users/services/userService");
                //userService.getUsersForNotifications(function(err,users) {
                //    console.log(users);
                //});

                //var cronService = require("../api/utilities/services/cronService");
                //cronService.isAllowed("* * * * 2");

//console.log(parseFloat("55678.42342").toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}));


                // var userService = require("../api/users/services/userService");
                // userService.getSystemUser(function (obj) {
                //     var SystemUser = obj.user;
                //     var PropertyMassUpdateService = require("../build/properties/services/PropertyMassUpdateService");
                //     PropertyMassUpdateService.massUpdate(SystemUser, null, ["5ba066c0d37b9761d08399a6"], "Owner", "test");
                // });

                // var PropertyService = require('../api/properties/services/propertyService');
                // PropertyService.getUnapproved("Owner").then(x=>{console.log(x)});
                if (workerId == 1) {
                    // var s3Service = require("../api/media/services/s3Service")
                    //
                    // var source =         {
                    //     "name" : "shutterstock_682989595.jpg",
                    //     "url" : "https://d138dweu4olq2b.cloudfront.net/92918600-19ac-11e8-ae5b-11a3309deeac.jpg",
                    //     "width" : 1620,
                    //     "height" : 1080
                    // };
                    // s3Service.copyImage(source, function(err,image) {
                    //     console.log(err,image)
                    // })

                    setTimeout(function() {
                        require('../config/seed').init();
                    }, 30000);

                //    var moment = require("moment");
                //    var end = moment().add(-1,"day").startOf('week').add(1,"day").utcOffset(-480);
                //    var start = moment(end).add(-7,"day")
                //    console.log(start.format(), end.format());
                //
                //    var end1 = moment().add(-1,"month").endOf('month').utcOffset(-480);
                //    var start1 = moment().add(-1,"month").startOf('month').utcOffset(-480);
                //    console.log(start1.format(), end1.format());
                //}

                // if (workerId == 1) {
                //     var userService = require("../api/users/services/userService");
                //     userService.getSystemUser(function (obj) {
                //         var SystemUser = obj.user;
                //         userService.search(SystemUser, {roleTypes: ['Guest','RM','BM'], ids: ['59fa02d92d119d3bd494e4b6']}, function (err, obj) {
                //             console.log(obj);
                //         });
                //     });
                // }


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
                    //     var PropertyService = require('../api/properties/services/propertyService')
                    //     PropertyService.search(SystemUser, {
                    //         limit: 10,
                    //         "active":true,
                    //         "geo":{"loc": [ 29.781522, -95.787601 ], "distance": 3},
                    //         select: "name address city state zip totalUnits",
                    //     }, function(err, props) {
                    //         console.log(props);
                    //     });
                    // });


                        }



            })
        };


    });

});