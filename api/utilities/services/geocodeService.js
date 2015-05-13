var geocoder = require('node-geocoder')("google", "http");
var redisService = require('./redisService')
var _ = require('lodash')

module.exports = {
    geocode: function (address, checkCache, callback) {

        redisService.get(address, function(err, result) {
            if (checkCache && (result || err)) {
                callback(err, result, true);
            } else {
                geocoder.geocode(address,function(err, result) {

                    if (!err) {
                        var rand = _.random(2, 20);
                        redisService.set(address, result, 86400 * rand);
                    }

                    callback(err, result, false);

                });
            }

        })

    }
}