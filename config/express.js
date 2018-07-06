"use strict";
const settings = require("./settings.js");
const error = require("./error.js");
const bodyParser = require("body-parser");
const expressJwt = require("express-jwt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const redisService = require("../api/utilities/services/redisService");
const newrelic = require("newrelic");

module.exports = {
        init: function(app, domain) {
            // Should be placed before express.static
            // To ensure that all assets and data are compressed (utilize bandwidth)
            app.use(compression({
                // Levels are specified in a range of 0 to 9, where-as 0 is
                // no compression and 9 is best compression, but slowest
                level: 9,
            }));

            const cacheTime = 86400000*7; // 7 days
            app.use(require("express").static(__dirname + "/../site/", {maxAge: cacheTime}));
            app.use("/bower_components", require("express").static(__dirname + "/../bower_components/", {maxAge: cacheTime}));
            app.use("/dist", require("express").static(__dirname + "/../dist/", {maxAge: cacheTime}));
            app.use("/node_modules", require("express").static(__dirname + "/../node_modules/", {maxAge: cacheTime}));

            app.use(error.getClient().expressHandler);

            app.use(cookieParser());

            app.set("view engine", "ejs");
            app.set("views", __dirname + "/../site/views");

            app.use((req, res, next) => {
                const host = req.headers.host.toString().toLowerCase();
                if ((host.indexOf("localhost") > -1 || host.indexOf("qa.biradix.com") > -1 || host.indexOf("herokuapp") > -1) && req.originalUrl === "/") {
                    const auth = {login: "testadmin@biradix.com", password: "temppass!"};

                    // parse login and password from headers
                    const b64auth = (req.headers.authorization || "").split(" ")[1] || ""
                    const [login, password] = new Buffer(b64auth, "base64").toString().split(":")

                    // Verify login and password are set and correct
                    if (!login || !password || login !== auth.login || password !== auth.password) {
                        res.set("WWW-Authenticate", "Basic realm=\"401\"");
                        res.status(401).send("Authentication required."); 
                        return;
                    }
                    next();
                } else {
                    next();
                }
            });

            // protect /api using middleware, allow /api/v/users/login and create to allow to authenticate
            app.use("/api", expressJwt(
                {
                    secret: settings.SECRET,
                    credentialsRequired: true,
                    getToken: function fromHeaderOrQuerystring(req) {
                        let token = null;
                        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
                            token = req.headers.authorization.split(" ")[1];
                        } else if (req.query && req.query.token) {
                            token = req.query.token;
                        }
                        return token;
                    },
                }
            )
            .unless({path:
                [settings.API_PATH + "users/login",
                    // settings.API_PATH + "users/create",
                    settings.API_PATH + "users/resetPassword",
                    settings.API_PATH + "users/recover",
                    settings.API_PATH + "users/updatePasswordByToken",
                    settings.API_PATH + "users/bounce",
                ],
            }));

            // protect /graphqli
            app.use("/graphqli", expressJwt(
                {
                    secret: settings.SECRET,
                    credentialsRequired: false,
                    getToken: function fromHeaderOrQuerystring(req) {
                        let token = null;
                        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
                            token = req.headers.authorization.split(" ")[1];
                        } else if (req.query && req.query.token) {
                            token = req.query.token;
                        }
                        return token;
                    },
                }
            ));

            app.use("/graphql", expressJwt(
                {
                    secret: settings.SECRET,
                    credentialsRequired: false,
                    getToken: function fromHeaderOrQuerystring(req) {
                        let token = null;
                        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
                            token = req.headers.authorization.split(" ")[1];
                        } else if (req.query && req.query.token) {
                            token = req.query.token;
                        }
                        return token;
                    },
                }
            ));

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

            // Middleware to insure session token is not hi-jacked by looking at user agent
            app.use(function(req, res, next) {
                if (req.user) {
                    // Backwards compatibility;
                    if (!req.user.id && typeof req.user == "string" && req.user.length == 32) {
                        req.user = {data: req.user};
                    }

                    redisService.getByKey(req.user.data, function(err, result) {
                        req.user = result;

                        if (!req.user || !req.user.active) {
                            return res.status(401).json("Unauthorized request");
                        }

                        newrelic.addCustomAttributes({
                            "User": req.user.first + " " + req.user.last,
                            "Email": req.user.email,
                        });

                        next();
                    });
                } else {
                    next();
                }
            });

            // Tokenize the full loggedin user back to a JWT token so it can be passed around to microservices
            app.use(function(req, res, next) {
                if (req.user) {
                    const token = jwt.sign({data: req.user}, settings.SECRET, {expiresIn: 30 * 60});
                    req.user_jwt = token;
                    next();
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

            // Override default Jwt unauthorized error
            app.use(function(err, req, res, next) {
                if (err.name === "UnauthorizedError") {
                    return res.status(401).json("Unauthorized request");
                }
                next();
            });

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
            // throw new Error("Test");
            // app.all("*", function(req, res, next) {
            //    console.log(req.path, req.headers, req.user)
            //    next();
            // })
        },
};
