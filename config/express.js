'use strict';
var settings = require('./settings.js')
var errors = require('./error')
var bodyParser = require('body-parser')
var expressJwt = require('express-jwt')
var cookieParser = require('cookie-parser')
var compression = require('compression')

module.exports = {
        init: function (app) {
            // Should be placed before express.static
            // To ensure that all assets and data are compressed (utilize bandwidth)
            app.use(compression({
                // Levels are specified in a range of 0 to 9, where-as 0 is
                // no compression and 9 is best compression, but slowest
                level: 9
            }));

            app.use(require('express').static(__dirname + '../../site/'));
            app.use('/bower_components',  require('express').static(__dirname + '../../bower_components/'));

            app.use(cookieParser())

            app.set('view engine', 'ejs');
            app.set('views', __dirname + '../../site/views')

            //protect /api using middleware, allow /api/v/users/login and create to allow to authenticate
            app.use('/api', expressJwt(
                {
                    secret: settings.SECRET,
                    credentialsRequired: true,
                    getToken: function fromHeaderOrQuerystring (req) {
                        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                            return req.headers.authorization.split(' ')[1];
                        } else if (req.query && req.query.token) {
                            return req.query.token;
                        }
                        return null;
                    }
                }
            )
            .unless({path:
                [settings.API_PATH + 'users/login'
                    //, settings.API_PATH + 'users/create'
                , settings.API_PATH + 'users/resetPassword'
                , settings.API_PATH + 'users/recover'
                , settings.API_PATH + 'users/updatePasswordByToken'
                ]
            }));

            //Middleware to populate operator context
            app.use(function (req, res, next) {
                var context = {ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress, user_agent: req.headers['user-agent']};
                req.context = context;
                next();
            });

            //Middleware to insure session token is not hi-jacked by looking at user agent
            app.use(function (req, res, next) {
                if (req.user && !req.user.active) {
                    return res.status(401).json('Unauthorized request');
                }
                next();
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

            app.use(errors.getClient().expressHandler);

            //app.all("*", function(req, res, next) {
            //    //console.log(req.path, req.cookies)
            //    next();
            //})
        }
}

