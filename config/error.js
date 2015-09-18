var settings = require('../config/settings')
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: settings.RAYGUN_APIKEY });
console.error = function(msg) {
    raygunClient.send(new Error(msg));
    process.stderr.write(msg);
};

module.exports = {
    getClient: function() {
        return raygunClient;
    },
    send : function(msg) {
        raygunClient.send(new Error(msg));
    }
}