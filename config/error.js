var settings = require('../config/settings')
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: settings.RAYGUN_APIKEY });

module.exports = {
    getClient: function() {
        return raygunClient;
    },
    send : function(msg,context) {
        raygunClient.user = function() {

            if (context && context.user) {

                return {
                    identifier: context.user.email,
                    //email: context.user.email,
                    fullName:  context.user.first + ' ' + context.user.last,
                    // firstName:  context.user.first,
                    uuid: context.user.orgs[0].name
                };

            }
        }

        raygunClient.send(new Error(msg),context);
    }
}