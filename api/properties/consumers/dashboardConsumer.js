var queues = require("../../../config/queues")
var DashboardService = require("../services/dashboardService")

queues.getDashboardQueue().consume(function(data,reply) {
    console.log(data.id + " dashboard started");
    DashboardService.getDashboard(data.user,data.id, data.options, function(err, dashboard) {
        console.log(data.id + " dashboard ended");
        reply({err: err, dashboard: dashboard});
    })
});

queues.getProfileQueue().consume(function(data,reply) {
    console.log(data.compId + " profile started");
    DashboardService.getProfile(data.user,data.options, data.checkManaged, data.subjectId, data.compId, function(err, profile) {
        console.log(data.compId + " profile ended");
        reply({err: err, profile: profile});
    })
});

