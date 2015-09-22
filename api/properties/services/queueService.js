var settings = require('../../../config/settings')
var queues = require('../../../config/queues')

module.exports = {
    getDashboard: function (req, callback) {
        var timer = new Date().getTime();
        queues.getExchange().publish({user: req.user, id: req.params.id, options: req.body},
            {
                key: settings.DASHBOARD_QUEUE,
                reply: function (data) {
                    console.log("Dashboard for " + req.params.id + ": " + (new Date().getTime() - timer) + "ms");
                    callback(data.err, data.dashboard);
                }
            }
        );
    },

    getProfile: function (user, options, checkManaged, subjectId, compId, callback) {
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
                    console.log("Profile Q for " + compId + ": " + (new Date().getTime() - timer) + "ms");
                    callback(data.err, data.profile);
                }
            }
        );
    }
}