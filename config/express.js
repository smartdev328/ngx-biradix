"use strict";

const settings = require("./settings.js");
const error = require("./error.js");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const request = require("request");

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

            app.use("/static",require('express').static(__dirname + '/../dist/biradix-platform/'
            ,{
              maxAge: cacheTime, setHeaders: (res, path) => {
                if (path.indexOf('index.html') > -1) {
                  res.setHeader('Cache-Control', 'public, max-age=0')
                }
              }
            }));

          app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
          });

            app.use(error.getClient().expressHandler);

            app.use(cookieParser());

            app.set("view engine", "ejs");
            app.set("views", __dirname + "/../site/views");

            app.use((req, res, next) => {
                let host = req.headers.host.toString().toLowerCase();
                if ((host.indexOf("qa.biradix.com") > -1 || host.indexOf("herokuapp") > -1)
                    && req.originalUrl === "/"
                    && req.headers["user-agent"] !== "PhantomJS"
                    && host.indexOf("biradixplatform-prod.herokuapp.com") === -1
                ) {
                    // parse login and password from headers
                    const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
                    const [login, password] = new Buffer(b64auth, "base64").toString().split(":");

                    if (host.indexOf("biradixplatform-qa-pr") > -1) {
                      host = "pr.biradix.com";
                    }

                  request.post('https://radix-nonprodaccessmanagement.herokuapp.com/logins', {form:
                      {domain: host, email: login, password: password}
                  }, function(err, httpResponse, body) {
                    if (body !== "true") {
                        res.set("WWW-Authenticate", "Basic realm=\"401\"");
                        res.status(401).send("Authentication required.");
                        return;
                    }
                    next();
                  });

                } else {
                    next();
                }
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
