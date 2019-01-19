require("newrelic");
const jwt = require("jsonwebtoken");
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

        app.get('/p/:token', function (req, res) {
            res.redirect('/#/password/reset/' + req.params.token);
        })

        app.get('/g/:propertyid/:token', function (req, res) {
            jwt.verify(req.params.token, settings.SECRET, function(err, decoded) {
                if (err) {
                    res.redirect('/#/expired');
                } else {
                    res.cookie('token', req.params.token);
                    res.cookie('tokenDate', "");
                    res.redirect('/#/dashboard2?id=' + req.params.propertyid)
                }
            });
        })

        const server = app.listen(settings.PORT, function() {
            console.log('WorkerID: %s, Port: %s', workerId, server.address().port);
        });
    });
});
