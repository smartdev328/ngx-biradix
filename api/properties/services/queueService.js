var settings = require('../../../config/settings')
var bus = require('../../../config/queues')

module.exports = {
    sendNotification: function(user, options, callback) {
        var timer = new Date().getTime();
        bus.query(settings.NOTIFICATIONS_QUEUE, {user: user,
                properties: options.properties,
                showLeases: options.showLeases,
                dontEmail: options.dontEmail,
                notification_columns: options.notification_columns,
                groupComps: options.groupComps,
            },
            function(data) {
                console.log("Send Notifications for " + user._id + ": " + (new Date().getTime() - timer) + "ms");
                callback(data);
            }
        );
    },
    getCompareReport: function(user, id, options, callback) {
        var timer = new Date().getTime();
        bus.query(settings.HISTORY_COMPARE_REPORT_QUEUE,{user: user, id: id, options: options},
            function (data) {
                //console.log("Compare report for " + id + ": " + (new Date().getTime() - timer) + "ms");
                callback(data.err, data.report);
            }
        );
    },
    getDashboard: function(req, callback) {
        // if (!bus.getQueue(settings.DASHBOARD_QUEUE).consuming) {
        //     return callback("Not consuming", null);
        // }
        // var timer = new Date().getTime();
        bus.query(settings.DASHBOARD_QUEUE,{user: req.user, id: req.params.id, options: req.body},
            function (data) {
                // console.log("Dashboard for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                callback(data.err, data.dashboard);
            }
        );
    },

    getProfile: function (user, options, checkManaged, subjectId, compId, callback) {
        var timer = new Date().getTime();
        bus.query(settings.PROFILE_QUEUE,{
                user: user,
                options: options,
                checkManaged: checkManaged,
                subjectId: subjectId,
                compId: compId
            },
            function (data) {
                //console.log("Profile Q for " + compId + ": " + (new Date().getTime() - timer) + "ms");
                callback(data.err, data.profile);
            }
        );
    }
}