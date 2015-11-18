var queues = require("../../../config/queues")

queues.getPhantomStatusQueue().consume(function(data,reply) {
     reply({data: data});
});

queues.attachQListeners(queues.getPhantomStatusQueue(), "Phantom Status");