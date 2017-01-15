var settings = require('../../../config/settings')
var queues = require('../../../config/queues')

module.exports = {
    updateGuestPermissionsForProperty: function (compid, callback) {
        var timer = new Date().getTime();
        queues.getExchange().publish({
                compid: compid
            },
            {
                key: settings.GUESTS_QUEUE,
                reply: function (data) {
                    callback(data);
                }
            }
        );
    },
}