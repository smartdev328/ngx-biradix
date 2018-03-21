const settings = require("./settings");
const jackrabbit = require("jackrabbit");
const EmailConsumerModule = require("../build/services/atomic/utilities.email/server/EmailConsumer");
const EmailServiceModule = require("../build/services/atomic/utilities.email/client/EmailService");
const EmailConsumer = new EmailConsumerModule.EmailConsumer();
global.emailService = new EmailServiceModule.EmailService();

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
                global.emailService.init(queue)]
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

