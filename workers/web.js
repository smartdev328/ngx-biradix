require('newrelic');
var settings = require('../config/settings')
var errors = require("../config/error")

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

        mongoose.connect(settings.MONGODB_URI);
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
            require('../config/seed').init();

            require('../config/express').init(app, d)
            app.use('/poc/', require('../poc/pocGateway'));
            app.use('/', require('../site/siteroutes'));
            app.use(settings.API_PATH + 'access/', require('../api/access/gateways/accessGateway'));
            app.use(settings.API_PATH + 'users/', require('../api/users/gateways/userGateway'));
            app.use(settings.API_PATH + 'properties/', require('../api/properties/gateways/propertyGateway'));
            app.use(settings.API_PATH + 'propertyusers/', require('../api/propertyusers/gateways/propertyUsersGateway'));
            app.use(settings.API_PATH + 'audit/', require('../api/audit/gateways/auditGateway'));
            app.use(settings.API_PATH + 'amenities/', require('../api/amenities/gateways/amenitiesGateway'));
            app.use('/contact', require('../api/contact/gateways/contactGateway'));
            app.use('/progress', require('../api/progress/gateways/progressGateway'));
            app.use('/status', require('../api/status/gateways/statusGateway'));
            app.get('/p/:token', function (req, res) {
                res.redirect('/#/password/reset/' + req.params.token)
            })

            if (!settings.SKIPRABBIT) {
                require('../api/status/consumers/webConsumer')

                if (settings.RUN_DASHBOARD == "web") {
                    require('../api/properties/consumers/dashboardConsumer');
                }

                if (settings.RUN_PHANTOM == "web") {
                    require('../api/properties/consumers/pdfConsumer')
                    require('../api/status/consumers/phantomConsumer')
                }
            }

            var server = app.listen(settings.PORT, function () {
                console.log('WorkerID: %s, Port: %s', workerId, server.address().port);

            })
        };


    });

});