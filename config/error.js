var settings = require('../config/settings')
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: settings.RAYGUN_APIKEY });

module.exports = {
    getClient: function() {
        return raygunClient;
    },
    send : function(msg,context) {
        raygunClient.send(new Error(msg),context);
    }
}