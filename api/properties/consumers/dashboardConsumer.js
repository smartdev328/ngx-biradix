var queues = require("../../../config/queues")
var DashboardService = require("../services/dashboardService")

queues.getDashboardQueue().consume(function(data,reply) {
    console.log(data.id + " dashboard started");
    try {
        DashboardService.getDashboard(data.user, data.id, data.options, function (err, dashboard) {
            //console.log(data.id + " dashboard ended");
            reply({err: err, dashboard: dashboard});
            dashboard = null;
        })
    }
    catch (ex) {
        reply({err: ex, dashboard: null});
        throw ex;
    }
});

queues.attachQListeners(queues.getDashboardQueue(), "Dashboard");

queues.getProfileQueue().consume(function(data,reply) {
    //console.log(data.compId + " profile started: " + (new Date()));
    try {
        DashboardService.getProfile(data.user, data.options, data.checkManaged, data.subjectId, data.compId, function (err, profile) {
            //console.log(data.compId + " profile ended: " + (new Date()));
            reply({err: err, profile: profile});
            profile = null;
        })
    }
    catch (ex) {
        reply({err: ex, profile: null});
        throw ex;
    }
});

queues.attachQListeners(queues.getDashboardQueue(), "Profile");

