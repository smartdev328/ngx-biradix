var bus = require("../../../config/queues")
var settings = require("../../../config/settings")

bus.handleQuery(settings.PHANTOM_STATUS_QUEUE, function(data,reply) {
     reply({data: data});
});
