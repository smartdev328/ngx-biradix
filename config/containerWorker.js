const settings = require("./settings");
const jackrabbit = require("jackrabbit");
const serviceRegistry = require("../build/services/gateway/ServiceRegistry");

const EmailServiceModule = require("../build/services/atomic/utilities.email/client/EmailService");
serviceRegistry.setEmailService(new EmailServiceModule.EmailService());

module.exports = {
    init: function(ready) {
        let timeout = setTimeout(function() {
            console.error("Services not loaded in time. Restarting");
            process.exit(0);
        }, 30000);

        const queue = jackrabbit(settings.CLOUDAMQP_URL);
        queue.on("error", function() {
            console.error("Rabbit Disconnected");
            process.exit(0);
        });

        queue.on("connected", function() {
            console.log("Re-usable Rabbit connected");
            Promise.all([
                serviceRegistry.getEmailService().init(queue),
                ]
            ).then((values) => {
                clearTimeout(timeout);
                ready();
            }).catch((error) => {
                console.error("Error initializing services", error);
                process.exit(0);
            });
        });
    },
};

