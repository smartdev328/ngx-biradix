require('newrelic')
var settings = require('./config/settings.js')
var express = require('express')
var app = express()
var mongoose = require('mongoose');
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: settings.RAYGUN_APIKEY });
mongoose.connect(settings.MONGODB_URI);
var conn = mongoose.connection;
var _ = require("lodash")

console.error = function(msg) {
    raygunClient.send(new Error(msg));
    process.stderr.write(msg);
};


conn.once('open', function () {
    require('./config/seed').init();
    require('./config/express').init(app)

    app.use('/poc/', require('./poc/pocGateway'));
    app.use('/', require('./site/siteroutes'));
    app.use(settings.API_PATH + 'access/', require('./api/access/gateways/accessGateway'));
    app.use(settings.API_PATH + 'users/', require('./api/users/gateways/userGateway'));
    app.use(settings.API_PATH + 'properties/', require('./api/properties/gateways/propertyGateway'));
    app.use(settings.API_PATH + 'propertyusers/', require('./api/propertyusers/gateways/propertyUsersGateway'));
    app.use(settings.API_PATH + 'audit/', require('./api/audit/gateways/auditGateway'));
    app.use(settings.API_PATH + 'amenities/', require('./api/amenities/gateways/amenitiesGateway'));
    app.use('/contact', require('./api/contact/gateways/contactGateway'));
    app.use('/progress', require('./api/progress/gateways/progressGateway'));
    app.get('/p/:token', function(req,res) {
        res.redirect('/#/password/reset/' + req.params.token)
    })
    require('./config/cluster').init(app)
});
