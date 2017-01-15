var settings = require('../config/settings')
var errors = require("../config/error")
var d= require("domain").create();

d.on("error", function(err) {
    console.log(err.stack);
    console.log(d.context);
    if (settings.MODE == "production") {
        errors.send(err.stack,d.context);
    }
});

d.run(function() {
    //Initialize CPU clustering
    require('../config/cluster').init({maxThreads: 2}, function (workerId) {
        console.log('WorkerID: %s', workerId)

        var mongoose = require('mongoose');
        var queues = require("../config/queues")

        var connectedCount = 0;

        queues.connect(function () {
            connectedCount++;
            ready();
        })

        mongoose.Promise = global.Promise;
        mongoose.connect(settings.MONGODB_URI);
        var conn = mongoose.connection;
        conn.once('open', function () {
            console.log({type: 'info', msg: 'connected', service: 'mongodb'});
            connectedCount++;
            ready();
        });


        function ready() {
            if (connectedCount < 2) {
                return;
            }

            if (settings.RUN_DASHBOARD == "worker") {
                require('../api/properties/consumers/dashboardConsumer');
                require('../api/properties/consumers/historyCompareConsumer');
                require('../api/properties/consumers/notificationsConsumer');
                require('../api/propertyusers/consumers/guestsConsumer');
            }

        }
    });
});



