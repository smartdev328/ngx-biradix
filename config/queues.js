var settings = require('./settings')
var jackrabbit = require("jackrabbit");
var errors = require('./error')

var queue;
var exchange;
var dashboard_queue;
var profile_queue;
var pdf_profile_queue;
var pdf_reporting_queue;
var web_status_queue;
var phantom_status_queue;
//var import_queue;
//var import_users_queue;

module.exports = {
    getExchange : function() {return exchange},
    getDashboardQueue : function() {return dashboard_queue},
    getProfileQueue : function() {return profile_queue},
    getPdfProfileQueue : function() {return pdf_profile_queue},
    getPdfReportingQueue : function() {return pdf_reporting_queue},
    getWebStatusQueue : function() {return web_status_queue},
    getPhantomStatusQueue : function() {return phantom_status_queue},
    //getImportQueue : function() {return import_queue},
    //getImportUsersQueue : function() {return import_users_queue},
    connect : function(callback) {

        if (settings.SKIPRABBIT) {
            console.log({ type: 'info', msg: 'skipped', service: 'rabbitmq' });
            callback();
            return;
        }
            queue = jackrabbit(settings.CLOUDAMQP_URL)
                .on('connected', function() {
                    //wait a sec before consuming queues;
                    setTimeout(function() {
                        exchange = queue.default();
                        dashboard_queue = exchange.queue({ name: settings.DASHBOARD_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });
                        profile_queue = exchange.queue({ name: settings.PROFILE_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });

                        pdf_profile_queue = exchange.queue({ name: settings.PDF_PROFILE_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });
                        pdf_reporting_queue = exchange.queue({ name: settings.PDF_REPORTING_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });

                        web_status_queue = exchange.queue({ name: settings.WEB_STATUS_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });
                        phantom_status_queue = exchange.queue({ name: settings.PHANTOM_STATUS_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });

                        //import_queue = exchange.queue({ name: settings.IMPORT_QUEUE, prefetch: 1, durable: false});
                        //import_users_queue = exchange.queue({ name: settings.IMPORT_USERS_QUEUE, prefetch: 1, durable: false});

                        console.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });

                        attachQListeners(dashboard_queue, "Dashboard");
                        attachQListeners(profile_queue, "Profile");
                        attachQListeners(pdf_profile_queue, "Pdf Profile");
                        attachQListeners(pdf_reporting_queue, "Pdf Reporting");
                        attachQListeners(web_status_queue, "Web Status");
                        attachQListeners(phantom_status_queue, "Phantom Status");

                        callback();
                    }, 1000);

                })
                .on('error', function(err) {
                   errors.send(err);
                })
                .on('disconnected', function() {
                   errors.send("Rabbit disconnected");
                });

    }
}

function attachQListeners(q, name) {
    q.on('consuming', function() {
            q.consuming = true;
            console.log(name+ " Q Consuming");
        })
        .on('close', function(err) {
            errors.send(err);
        })
        .on('error', function(err) {
            errors.send(err);
        })
        .on('ready', function() {
            console.log(name+ " Q Ready");
        })
        .on('connected', function() {
            console.log(name+ " Q Connected");
        });

    //check if the q is consuming in 10 seconds
    setTimeout(function() {
        isConsuming(q,name );
    }, 30000)
}

function isConsuming(q, name) {
    console.log(name,'Consuming:' + (q.consuming === true));

    if (!q.consuming === true) {
        console.log('Exiting due to not consuming');
        process.exit(0);
    }
}