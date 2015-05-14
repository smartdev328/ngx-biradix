require('newrelic')
var settings = require('./config/settings.js')
var express = require('express')
var app = express()
var mongoose = require('mongoose');
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: settings.RAYGUN_APIKEY });
mongoose.connect(settings.MONGODB_URI);
var conn = mongoose.connection;

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
    app.use('/contact', require('./api/contact/gateways/contactGateway'));
    app.get('/p/:token', function(req,res) {
        res.redirect('/#/password/reset/' + req.params.token)
    })
    require('./config/cluster').init(app)

    //var PropertyService = require('./api/properties/services/propertyService')
    //var Aurelian = { name: 'Aurelian Apartments', address: '1418 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 632-2596', owner: 'Rome', management: 'Rome', yearBuilt: 2007, orgid: '5552eae4684d5af41a0400e0'}
    //PropertyService.create(Aurelian, function() {});
});
