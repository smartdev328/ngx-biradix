const settings = require("./settings");
const jackrabbit = require("jackrabbit");
const redis = require("redis");
const redisClient = redis.createClient(settings.REDIS_URL);
const serviceRegistry = require("../build/services/gateway/ServiceRegistry");

const EmailConsumerModule = require("../build/services/atomic/utilities.email/server/EmailConsumer");
const EmailServiceModule = require("../build/services/atomic/utilities.email/client/EmailService");
const EmailConsumer = new EmailConsumerModule.EmailConsumer();
serviceRegistry.setEmailService(new EmailServiceModule.EmailService());

const ShortenerConsumerModule = require("../build/services/atomic/utilities.shortener/server/ShortenerConsumer");
const ShortenerConsumer = new ShortenerConsumerModule.ShortenerConsumer();
const ShortenerServiceModule = require("../build/services/atomic/utilities.shortener/client/ShortenerService");
serviceRegistry.setShortenerService(new ShortenerServiceModule.ShortenerService());

module.exports = {
    init: function(ready) {
        let timeout = setTimeout(function() {
            console.log("Services not loaded in time. Restarting");
            process.exit(0);
        }, 30000);

        const queue = jackrabbit(settings.CLOUDAMQP_URL);
        queue.on("connected", function() {
            console.log("Re-usable Rabbit connected");
            Promise.all([
                EmailConsumer.init(queue),
                serviceRegistry.getEmailService().init(queue),
                ShortenerConsumer.init(queue, redisClient),
                serviceRegistry.getShortenerService().init(queue, redisClient),
                ]
            ).then((values) => {
                clearTimeout(timeout);
                ready();
            }).catch((error) => {
                console.log("Error initializing services", error);
                process.exit(0);
            });
        });
    },
};

