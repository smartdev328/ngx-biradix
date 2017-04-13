var settings = require('../../../config/settings')
var bus = require('../../../config/queues')

module.exports = {
    updateGuestPermissionsForProperty: function (compid, callback) {
        var timer = new Date().getTime();
        bus.command(settings.GUESTS_QUEUE,{compid: compid},
            function (data) {
                callback(data);
            }
        );
    },
}