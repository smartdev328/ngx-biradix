var settings = require('../config/settings')
var errors = require("../config/error")

var d= require("domain").create();

d.on("error", function(err) {
    console.log(err);
    errors.send(err);

});

d.run(function() {
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

        require('../config/cluster').init({maxThreads: 2}, function (workerId) {
            var server = app.listen(settings.PORT, function () {
                console.log('WorkerID: %s, Port: %s', workerId, server.address().port)

                require('../config/express').init(app)
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
                app.get('/p/:token', function (req, res) {
                    res.redirect('/#/password/reset/' + req.params.token)
                })
            })
        });
    };
});