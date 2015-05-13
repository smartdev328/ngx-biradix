'use strict';
var PropertySchema= require('../schemas/propertySchema')
var GeocodeService = require('../../utilities/services/geocodeService')

module.exports = {
    create: function(property, callback) {

        GeocodeService.geocode(property.address + ' ' + property.city + ' ' + property.state + ' ' + property.zip, true, function(err, res, fromCache) {
            console.log(res[0].latitude, res[0].longitude);

            var n = new PropertySchema();

            n.loc = [res[0].latitude, res[0].longitude]
            n.name = property.name;
            n.address = property.address;
            n.city = property.city;
            n.state = property.state;
            n.zip = property.zip;
            n.phone = property.phone;
            n.owner = property.owner;
            n.management = property.management;
            n.date = Date.now();

            n.save(function (err, prop) {
                callback(err, prop);

            });
        });

    }
}