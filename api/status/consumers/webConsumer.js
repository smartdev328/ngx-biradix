var settings = require("../../../config/settings")
var bus = require("../../../config/queues")

bus.handleQuery(settings.WEB_STATUS_QUEUE, function(data,reply) {
     reply({data: data});
});
