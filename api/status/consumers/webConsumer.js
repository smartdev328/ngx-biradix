var queues = require("../../../config/queues")

queues.getWebStatusQueue().consume(function(data,reply) {
     reply({data: data});
});

queues.attachQListeners(queues.getWebStatusQueue(), "Web Status");