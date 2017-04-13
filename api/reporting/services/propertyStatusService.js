'use strict';
var settings = require('../../../config/settings')
var bus = require('../../../config/queues')

module.exports = {
    run: function(user, propertyids, showLeases, callback) {
        var timer = new Date().getTime();
        bus.query(
            settings.NOTIFICATIONS_QUEUE
            ,{user: user, properties: propertyids, showLeases: showLeases, dontEmail: true}
            , function (response) {
                console.log("Send Notifications for " + user._id + ": " + (new Date().getTime() - timer) + "ms");
                callback(response.data);
            }
        );
    }
}