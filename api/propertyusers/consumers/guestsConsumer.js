var queues = require("../../../config/queues")
var propertyUsersService = require("../services/propertyUsersService")

queues.getGuestsQueue().consume(function(data,reply) {
    console.log(data.compid + " guests for comp started");
    try {
        propertyUsersService.updateGuestPermissionsForProperty(data.compid, function () {
            console.log(data.compid + " guests for comp ended");
            reply({done:true});
        })
    }
    catch (ex) {
        reply({err: ex, dashboard: null});
        throw ex;
    }
});

queues.attachQListeners(queues.getGuestsQueue(), "Guests");


