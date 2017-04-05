'use strict';
var settings = require('../../../config/settings')
var queues = require('../../../config/queues')

module.exports = {
    run: function(user, propertyids, showLeases, callback) {
        var timer = new Date().getTime();
        queues.getExchange().publish({user: user, properties: propertyids, showLeases: showLeases, dontEmail: true},
            {
                key: settings.NOTIFICATIONS_QUEUE,
                reply: function (response) {
                    console.log("Send Notifications for " + user._id + ": " + (new Date().getTime() - timer) + "ms");
                    callback(response.data);
                }
            }
        );
    }
}