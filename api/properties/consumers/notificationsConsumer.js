var queues = require("../../../config/queues")
var queueService = require('../services/queueService');
var propertyService = require('../services/propertyService');
var async = require("async");
var _ = require("lodash");

queues.getNotificationsQueue().consume(function(data,reply) {

    async.parallel({
        properties : function(callbackp) {
            if (data.properties && data.properties.length > 0) {
                callbackp(null,data.properties);
            } else {
                propertyService.search(data.user, {
                    select:"_id",
                    limit: 1000,
                    permission: 'PropertyManage',
                    active: true
                }, function(err,props) {
                    callbackp(err, _.pluck(props,"_id"));
                })

            }
        }
    }, function(err, all) {
        if (all.properties.length > 0) {
            async.eachLimit(all.properties, 20, function(id, callbackp){
                queueService.getCompareReport(data.user, id, function (err, report) {

                    if (report.length > 2) {
                        console.log(report);
                    }

                    callbackp(null);
                })
            }, function(err) {
                reply({done: true});
            });

        } else {
            reply({done: true});
        }

    });
});

queues.attachQListeners(queues.getNotificationsQueue(), "Notifications Compare");


