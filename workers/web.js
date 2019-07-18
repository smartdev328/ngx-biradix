require("newrelic");
const settings = require("../config/settings");
const errors = require("../config/error");

let d = require("domain").create();

d.on("error", function(err) {
    console.log(err.stack);
    console.log(d.context);
    if (settings.MODE == "production") {
        errors.send(err.stack, d.context);
    }
});

d.run(function() {
    require('../config/cluster').init({maxThreads: 1}, function(workerId) {
        var express = require('express')
        var app = express();
        require("../config/express").init(app, d);
        app.use('/', require('../site/siteroutes'));

        const server = app.listen(settings.PORT, function() {
            console.log('WorkerID: %s, Port: %s', workerId, server.address().port);
        });
    });
});
