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
    app.use('/contact', require('./api/contact/gateways/contactGateway'));
    app.use('/progress', require('./api/progress/gateways/progressGateway'));
    app.get('/p/:token', function(req,res) {
        res.redirect('/#/password/reset/' + req.params.token)
    })
    require('./config/cluster').init(app)

    //var PropertyService = require('./api/properties/services/propertyService')
    //var Aurelian = { name: 'Aurelian Apartments', address: '1418 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 632-2596', owner: 'Rome', management: 'Rome', yearBuilt: 2007, orgid: '5552eae4684d5af41a0400e0'}
    //PropertyService.create(Aurelian, function() {});
    //
    //var PropertyService = require('./api/properties/services/propertyService')
    ////var Aurelian = { name: 'Aurelian Apartments', address: '1418 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 632-2596', owner: 'Rome', management: 'Rome', yearBuilt: 2007, orgid: '5552eae4684d5af41a0400e0'}
    //PropertyService.linkComp("55693a70b0ce54e009970dd4","55693a70b0ce54e009970dd4", function() {});

    //var PropertyService = require('./api/properties/services/propertyService')
    //PropertyService.getSubjects("55719b7f68b870b818f3d022",{select:"_id name comps"}, function(err, obj) {
    //    var exclusions = [];
    //
    //    var compFloorplans = [ 2530, 2531, 2532, 2533, 2534, 2535, 2536, 2537, 2538, 2539, 2540 ];
    //    obj.forEach(function(p) {
    //        var comp = _.find(p.comps, function(c) {return c.id.toString() == "55719b7f68b870b818f3d022"})
    //        if (comp.excluded) {
    //            exclusions.push({subjectid: p._id, floorplans: _.difference(compFloorplans, comp.floorplans)});
    //            //console.log(p._id);
    //            //console.log(comp);
    //            //console.log(_.difference(compFloorplans, comp.floorplans))
    //        }
    //    })
    //
    //    console.log(exclusions);
    //});
});
