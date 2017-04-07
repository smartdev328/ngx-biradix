var geocoder = require('node-geocoder')("google", "http");
var redisService = require('./redisService')
var _ = require('lodash')

module.exports = {
    geocode: function (address, checkCache, callback) {
        //This is Stupid
        if (address.toLowerCase().indexOf("3404 brice knoll") > -1) {
            return callback(null,[35.372665, -80.789559],true);
        }

        redisService.get(address, function(err, result) {
            if (checkCache && result && result[0]) {
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