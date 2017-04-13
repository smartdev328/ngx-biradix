var bus = require("../../../config/queues")
var settings = require("../../../config/settings")

var propertyUsersService = require("../services/propertyUsersService")

bus.handleCommand(settings.GUESTS_QUEUE, function(data,reply) {
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



