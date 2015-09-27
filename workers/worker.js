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
    var mongoose = require('mongoose');
    var queues = require("../config/queues")

    var connectedCount = 0;

    queues.connect(function () {
        connectedCount++;
        ready();
    })

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

        var clusterConfig = require('../config/cluster')

        if (settings.RUN_DASHBOARD == "worker") {
            require('../api/properties/consumers/dashboardConsumer');
        }

        if (settings.RUN_PHANTOM == "worker") {
            require('../api/properties/consumers/pdfConsumer')
        }

        //Initialize CPU clustering
        clusterConfig.init({maxThreads: 0}, function (workerId) {
            console.log('WorkerID: %s', workerId)
        });

    }
});



