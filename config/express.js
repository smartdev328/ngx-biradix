"use strict";

const settings = require("./settings.js");
const error = require("./error.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compression = require("compression");

module.exports = {
        init: function(app, domain) {
            // Should be placed before express.static
            // To ensure that all assets and data are compressed (utilize bandwidth)
            app.use(compression({
                // Levels are specified in a range of 0 to 9, where-as 0 is
                // no compression and 9 is best compression, but slowest
                level: 9,
            }));

            let cacheTime = 86400000*7; // 7 days

            if (settings.MODE !== "production") {
                cacheTime = 0;
            }

            app.use(require("express").static(__dirname + "/../site/", {maxAge: cacheTime}));
            app.use("/bower_components", require("express").static(__dirname + "/../bower_components/", {maxAge: cacheTime}));
            app.use("/dist", require("express").static(__dirname + "/../dist/", {maxAge: cacheTime}));
            app.use("/node_modules", require("express").static(__dirname + "/../node_modules/", {maxAge: cacheTime}));

            app.use(error.getClient().expressHandler);

            app.use(cookieParser());

            app.set("view engine", "ejs");
            app.set("views", __dirname + "/../site/views");

            // app.use((req, res, next) => {
            //     const host = req.headers.host.toString().toLowerCase();
            //     if ((host.indexOf("localhost") > -1 || host.indexOf("qa.biradix.com") > -1 || host.indexOf("herokuapp") > -1) && req.originalUrl === "/" && req.headers["user-agent"] !== "PhantomJS") {
            //         const auth = {login: "testadmin@biradix.com", password: "temppass!",
            //                     login2: "testdesign@biradix.com", password2: "design51!"};
            //
            //         // parse login and password from headers
            //         const b64auth = (req.headers.authorization || "").split(" ")[1] || ""
            //         const [login, password] = new Buffer(b64auth, "base64").toString().split(":")
            //
            //         // Verify login and password are set and correct
            //         var wrongCredentials = true;
            //         if((login === auth.login && password === auth.password) || (login === auth.login2 && password === auth.password2)) {
            //             wrongCredentials = false;
            //         }
            //         if (!login || !password || wrongCredentials) {
            //             res.set("WWW-Authenticate", "Basic realm=\"401\"");
            //             res.status(401).send("Authentication required.");
            //             return;
            //         }
            //         next();
            //     } else {
            //         next();
            //     }
            // });

            // Middleware to populate operator context
            app.use(function(req, res, next) {
                req.context = {ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress, user_agent: req.headers["user-agent"]};

                if (req.headers["x-forwarded-proto"] !== "https") {
                    req.basePath = "http://" + req.headers.host;
                } else {
                    req.basePath = "https://" + req.headers.host;
                }
                next();
            });

            // Parse body into req for form submission
            app.use(bodyParser.json({limit: "50mb"}));
            app.use(bodyParser.urlencoded({
                extended: true,
                limit: "50mb",
            }));

            // Add request context to domain for debugging
            app.use(function(req, res, next) {
                domain.context = {
                    url: req.protocol + "://" + req.get("host") + req.originalUrl,
                    body: req.body,
                    query: req.query,
                    headers: req.headers,
                    user: req.user,
                };

                next();
            });
        },
};
