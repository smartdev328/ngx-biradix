var geocoder = require('node-geocoder')("google", "http");
var redisService = require('./redisService')
var _ = require('lodash')
var EmailService = require('./emailService')

module.exports = {
    geocode: function (address, checkCache, callback) {
        //This is Stupid
        if (address.toLowerCase().indexOf("3404 brice knoll") > -1 || address.toLowerCase().indexOf("7304 brice knoll") > -1) {
            return callback(null,[{latitude: 35.372665,longitude: -80.789559}],true);
        }

        redisService.get(address, function(err, result) {
            if (checkCache && result && result[0] && result[0].latitude) {

                // var email = {
                //    from: 'alex@biradix.com',
                //    to: 'alex@biradix.com',
                //    subject: 'Geo from Cache',
                //    html: '<b>' + address +'</b><hr>' + JSON.stringify(err) + '<hr>' + JSON.stringify(result)
                // };
                //
                // EmailService.send(email,function(){});

                callback(err, result, true);
            } else {
                geocoder.geocode(address,function(err, result) {

                    if (!err) {
                        var rand = _.random(2, 20);
                        redisService.set(address, result, 86400 * rand);
                    }

                    // var email = {
                    //     from: 'alex@biradix.com',
                    //     to: 'alex@biradix.com',
                    //     subject: 'Geo from Service',
                    //     html: '<b>' + address +'</b><hr>' + JSON.stringify(err) + '<hr>' + JSON.stringify(result)
                    // };
                    //
                    // EmailService.send(email,function(){});

                    callback(err, result, false);

                });
            }

        })

    }
}