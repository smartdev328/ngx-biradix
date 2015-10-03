var settings = require('./settings')
var jackrabbit = require("jackrabbit");
var errors = require('./error')

var queue;
var exchange;
var dashboard_queue;
var profile_queue;
var pdf_profile_queue;
var pdf_reporting_queue;

module.exports = {
    getExchange : function() {return exchange},
    getDashboardQueue : function() {return dashboard_queue},
    getProfileQueue : function() {return profile_queue},
    getPdfProfileQueue : function() {return pdf_profile_queue},
    getPdfReportingQueue : function() {return pdf_reporting_queue},
    connect : function(callback) {

        if (settings.SKIPRABBIT) {
            console.log({ type: 'info', msg: 'skipped', service: 'rabbitmq' });
            callback();
            return;
        }
        queue = jackrabbit(settings.CLOUDAMQP_URL).on('connected', function() {
            exchange = queue.default();
            dashboard_queue = exchange.queue({ name: settings.DASHBOARD_QUEUE, prefetch: 1, durable: false });
            profile_queue = exchange.queue({ name: settings.PROFILE_QUEUE, prefetch: 1, durable: false });
            pdf_profile_queue = exchange.queue({ name: settings.PDF_PROFILE_QUEUE, prefetch: 1, durable: false });
            pdf_reporting_queue = exchange.queue({ name: settings.PDF_REPORTING_QUEUE, prefetch: 1, durable: false });
            console.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });
            callback();
        })
        .on('error', function(err) {
           errors.send(err);
        })
        .on('disconnected', function() {
           errors.send("Rabbit disconnected");
        });

    }
}