var settings = require('./settings')
var jackrabbit = require("jackrabbit");
var errors = require('./error')

var queue;
var exchange;
var queues = {};

module.exports = {
    getQueue: function(key) {
        return queues[key];
    },
    handleCommand: function(key,consumer) {
        queues[key].consume(consumer);
        this.attachQListeners(queues[key], key);
    },
    handleQuery: function(key,consumer) {
        queues[key].consume(consumer);
        this.attachQListeners(queues[key], key);
    },

    command: function(key,data,callback) {
        exchange.publish(data,
            {
                key: key,
                reply: callback
            }
        );
    },

    query: function(key,data,callback) {
        exchange.publish(data,
            {
                key: key,
                reply: callback
            }
        );
    },
    connect : function(callback) {
        queue = jackrabbit(settings.CLOUDAMQP_URL)
            .on('connected', function() {
                //wait a sec before consuming queues;
                setTimeout(function() {
                    exchange = queue.default();
                    queues[settings.DASHBOARD_QUEUE] = exchange.queue({ name: settings.DASHBOARD_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });
                    queues[settings.PROFILE_QUEUE] = exchange.queue({ name: settings.PROFILE_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });

                    queues[settings.PDF_PROFILE_QUEUE] = exchange.queue({ name: settings.PDF_PROFILE_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });
                    queues[settings.PDF_REPORTING_QUEUE] = exchange.queue({ name: settings.PDF_REPORTING_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });

                    queues[settings.WEB_STATUS_QUEUE] = exchange.queue({ name: settings.WEB_STATUS_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });
                    queues[settings.PHANTOM_STATUS_QUEUE] = exchange.queue({ name: settings.PHANTOM_STATUS_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });

                    queues[settings.HISTORY_COMPARE_REPORT_QUEUE] = exchange.queue({ name: settings.HISTORY_COMPARE_REPORT_QUEUE, prefetch: 1, durable: false, arguments : {"x-message-ttl" : 120000 } });

                    queues[settings.NOTIFICATIONS_QUEUE] = exchange.queue({ name: settings.NOTIFICATIONS_QUEUE, prefetch: 1, durable: false });

                    queues[settings.GUESTS_QUEUE] = exchange.queue({ name: settings.GUESTS_QUEUE, prefetch: 1, durable: false });

                    console.log({ type: 'info', msg: 'connected', service: 'rabbitmq' });

                    callback();
                }, 1000);

            })
            .on('error', function(err) {
                errors.send(err);
            })
            .on('disconnected', function() {
                errors.send("Rabbit disconnected");
            });

    },
    attachQListeners: function(q, name) {
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

        //check if the q is consuming in 20 seconds
        setTimeout(function() {
            isConsuming(q,name );
        }, 20000)
    }
}



function isConsuming(q, name) {
    console.log(name,'Consuming:' + (q.consuming === true));

    if (!q.consuming === true) {
        console.log('Exiting due to not consuming');
        process.exit(0);
    }
}