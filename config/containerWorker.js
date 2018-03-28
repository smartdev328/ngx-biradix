const settings = require("./settings");
const jackrabbit = require("jackrabbit");
const mongoose = require("mongoose");

const serviceRegistry = require("../build/services/gateway/ServiceRegistry");

const EmailServiceModule = require("../build/services/atomic/utilities.email/client/EmailService");
serviceRegistry.setEmailService(new EmailServiceModule.EmailService());
const OrganizationServiceModule = require("../build/services/atomic/organizations/client/OrganizationService");
serviceRegistry.setOrganizationService(new OrganizationServiceModule.OrganizationService());

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

        let counter = 0;
        queue.on("connected", function() {
            console.log("Re-usable Rabbit connected");
            counter++;
            register();
        });

        let conn = mongoose.createConnection(settings.MONGODB_URI, {useMongoClient: true, poolSize: settings.MONGODB_POOL_SIZE});

        conn.once("open", function() {
            console.log("Re-usable Mongo connected");
            counter++;
            register();
        });

        /**

         */
        function register() {
            if (counter < 2) {
                return;
            }
            Promise.all([
                serviceRegistry.getEmailService().init(queue),
                serviceRegistry.getOrganizationService().init(queue),
                ]
            ).then((values) => {
                // serviceRegistry.getOrganizationService().read({criteria: {
                //         isDefault: true,
                //     }}).then((x)=> {
                //     console.log(x);
                // }).catch((error) => {
                //     console.log(error);
                // });
                clearTimeout(timeout);
                ready();
            }).catch((error) => {
                console.error("Error initializing services", error);
                process.exit(0);
            });
        }
    },
};

