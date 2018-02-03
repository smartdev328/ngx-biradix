var NodeGeocoder = require('node-geocoder');
var options = {
    provider: 'google',
    apiKey: 'AIzaSyDmWIi-fgJL9nzi9S2oX42grQxqzfLvaeU'
};
var geocoder = NodeGeocoder(options);
var redisService = require('./redisService')
var _ = require('lodash')


module.exports = {
    geocode: function (address, checkCache, callback) {
        //This is Stupid
        if (address.toLowerCase().indexOf("3404 brice knoll") > -1 || address.toLowerCase().indexOf("7304 brice knoll") > -1) {
            return callback(null,[{latitude: 35.372665,longitude: -80.789559}],true);
        }

        redisService.get(address, function(err, result) {
            if (checkCache && result && result[0] && result[0].latitude) {

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