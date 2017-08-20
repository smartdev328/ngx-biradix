'use strict';
var settings = require('./settings.js')
var error = require('./error.js')
var bodyParser = require('body-parser')
var expressJwt = require('express-jwt')
var cookieParser = require('cookie-parser')
var compression = require('compression')
var redisService = require('../api/utilities/services/redisService')
var newrelic = require("newrelic");

module.exports = {
        init: function (app, domain) {
            // Should be placed before express.static
            // To ensure that all assets and data are compressed (utilize bandwidth)
            app.use(compression({
                // Levels are specified in a range of 0 to 9, where-as 0 is
                // no compression and 9 is best compression, but slowest
                level: 9
            }));

            var cacheTime = 86400000*7;     // 7 days
            app.use(require('express').static(__dirname + '/../site/',{ maxAge: cacheTime }));
            app.use('/bower_components',  require('express').static(__dirname + '/../bower_components/',{ maxAge: cacheTime }));
            app.use('/dist',  require('express').static(__dirname + '/../dist/',{ maxAge: cacheTime }));
            app.use('/node_modules',  require('express').static(__dirname + '/../node_modules/',{ maxAge: cacheTime }));

            app.use(error.getClient().expressHandler);

            app.use(cookieParser())

            app.set('view engine', 'ejs');
            app.set('views', __dirname + '/../site/views')

            //protect /api using middleware, allow /api/v/users/login and create to allow to authenticate
            app.use('/api', expressJwt(
                {
                    secret: settings.SECRET,
                    credentialsRequired: true,
                    getToken: function fromHeaderOrQuerystring (req) {
                        var token = null;
                        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                            token = req.headers.authorization.split(' ')[1];
                        } else if (req.query && req.query.token) {
                            token =  req.query.token;
                        }
                        return token;
                    }
                }
            )
            .unless({path:
                [settings.API_PATH + 'users/login'
                    //, settings.API_PATH + 'users/create'
                    , settings.API_PATH + 'users/resetPassword'
                    , settings.API_PATH + 'users/recover'
                    , settings.API_PATH + 'users/updatePasswordByToken'
                    , settings.API_PATH + 'users/bounce'
                ]
            }));

            //Middleware to populate operator context
            app.use(function (req, res, next) {
                var context = {ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress, user_agent: req.headers['user-agent']};
                req.context = context;


                if (req.headers['x-forwarded-proto'] !== 'https') {
                    req.basePath = "http://" + req.headers.host;
                } else {
                    req.basePath = "https://" + req.headers.host;
                }
                next();
            });

            //Middleware to insure session token is not hi-jacked by looking at user agent
            app.use(function (req, res, next) {
                if (req.user) {

                    //Backwards compatibility;
                    if (!req.user.id && typeof req.user == "string" && req.user.length == 32) {
                        req.user = {data: req.user};
                    }

                    redisService.getByKey(req.user.data, function(err, result) {

                        req.user = result;

                        if (!req.user || !req.user.active) {
                            return res.status(401).json('Unauthorized request');
                        }

                        newrelic.addCustomParameters({
                            "User": req.user.first + ' ' + req.user.last,
                            "Email": req.user.email
                        });

                        next();
                    });

                } else {
                    next();
                }


            });

             //Parse body into req for form submission
            app.use(bodyParser.json({limit:'50mb'}));
            app.use(bodyParser.urlencoded({
                extended: true,
                limit:'50mb'
            }));

            //Override default Jwt unauthorized error
            app.use(function (err, req, res, next) {
                if (err.name === 'UnauthorizedError') {
                    return res.status(401).json('Unauthorized request');
                }
                next();
            });


            //Add request context to domain for debugging
            app.use(function (req, res, next) {
                domain.context = {
                    url: req.protocol + '://' + req.get('host') + req.originalUrl,
                    body: req.body,
                    query: req.query,
                    headers: req.headers,
                    user: req.user
                };

                next();
            });


            //throw new Error("Test");


            // app.all("*", function(req, res, next) {
            //    console.log(req.path, req.headers, req.user)
            //    next();
            // })
        }
}

