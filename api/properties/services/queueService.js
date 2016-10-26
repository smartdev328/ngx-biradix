var settings = require('../../../config/settings')
var queues = require('../../../config/queues')
var DashboardService = require("../services/dashboardService")

module.exports = {
    sendNotification: function(user, options, callback) {
        var timer = new Date().getTime();
        queues.getExchange().publish({user: user, properties: options.properties, showLeases: options.showLeases, dontEmail: options.dontEmail},
            {
                key: settings.NOTIFICATIONS_QUEUE,
                reply: function (data) {
                    console.log("Send Notifications for " + user._id + ": " + (new Date().getTime() - timer) + "ms");
                    callback(data);
                }
            }
        );
    },
    getCompareReport: function(user, id, callback) {
        var timer = new Date().getTime();
        queues.getExchange().publish({user: user, id: id},
            {
                key: settings.HISTORY_COMPARE_REPORT_QUEUE,
                reply: function (data) {
                    //console.log("Compare report for " + id + ": " + (new Date().getTime() - timer) + "ms");
                    callback(data.err, data.report);
                }
            }
        );
    },
    getDashboard: function (req, callback) {

        if (settings.SKIPRABBIT) {
            DashboardService.getDashboard(req.user,req.params.id, req.body, function(err, dashboard) {
                callback(err, dashboard);
            })
        }
        else {
            var timer = new Date().getTime();
            queues.getExchange().publish({user: req.user, id: req.params.id, options: req.body},
                {
                    key: settings.DASHBOARD_QUEUE,
                    reply: function (data) {
                        //console.log("Dashboard for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                        callback(data.err, data.dashboard);
                    }
                }
            );
        }
    },

    getProfile: function (user, options, checkManaged, subjectId, compId, callback) {
        if (settings.SKIPRABBIT) {
            DashboardService.getProfile(user,options, checkManaged, subjectId, compId, function(err, profile) {
                callback(err, profile);
            })
        }
        else {

            var timer = new Date().getTime();
            queues.getExchange().publish({
                    user: user,
                    options: options,
                    checkManaged: checkManaged,
                    subjectId: subjectId,
                    compId: compId
                },
                {
                    key: settings.PROFILE_QUEUE,
                    reply: function (data) {
                        //console.log("Profile Q for " + compId + ": " + (new Date().getTime() - timer) + "ms");
                        callback(data.err, data.profile);
                    }
                }
            );
        }
    }
}