'use strict';

var jwt = require('jsonwebtoken');
var fs = require('fs')
var UserSchema= require('../schemas/userSchema')
var UtilityService = require('./utilityService')
var EmailService = require('../../business/services/emailService')
var LiquidService = require('../../utilities/services/liquidService')
var settings = require('../../../config/settings')

module.exports = {
    getUserByRecoveryToken: function(token,callback) {
        if (token) {
            jwt.verify(token, settings.SECRET, function(err, decoded) {
                if (err) {
                    callback(null)
                }
                else {
                    UserSchema.findOne({
                        _id: decoded.id
                    }, function(err, usr) {
                        if (usr) {
                            callback(usr);
                        } else {
                            callback(null)
                        }
                    })
                }
            });
        } else {
            callback(null)
        }
    },
    resetPassword: function(email,callback) {
        email = email || '';

        if (email === '')
        {
            return callback(false);
        }

        var emailLower = email.toLowerCase();

        UserSchema.findOne({
                emailLower: emailLower
            }, function(err, usr) {
                if (!usr) {
                    return callback(false);
                }

                var token = jwt.sign({id: usr._id}, settings.SECRET, { expiresInMinutes: 30 });

                fs.readFile(process.cwd() +'/api/business/templates/password.html', 'utf8', function (err,data) {
                    LiquidService.parse(data, {first: usr.first, email: usr.email, link: process.env.baseurl + "/p/" + token },  null, function(result) {
                        var email = {
                            to: usr.email,
                            subject: 'Password recovery',
                            html: result
                        };
                        EmailService.send(email,function(emailError,status) {
                            return callback(true);
                        })
                    })

                });



            }
        )

    },
    login : function(user, success, error) {
        var modelErrors = [];
        user.email = user.email || '';
        user.password = user.password || '';
        user.emailLower = user.email.toLowerCase();

        if (user.email === '')
        {
            modelErrors.push({param: 'email', msg : 'Missing email address.'});
        }

        if (user.password === '')
        {
            modelErrors.push({param: 'password', msg : 'Missing password.'});
        }

        if (modelErrors.length > 0) {
            error(modelErrors);
            return;
        }

        UserSchema.findOne({
                emailLower: user.emailLower
            }, function(err, usr) {

            if (err) {
                modelErrors.push({msg: 'Unexpected Error. Unable to login.'});
                error(modelErrors);
                return;
            }

            if (!usr) {
                modelErrors.push({msg: 'Unable to validate email address / password.'});
                error(modelErrors);
                return;
            }

            if (usr.hashed_password !== UtilityService.hashPassword(user.password, usr.salt)) {
                modelErrors.push({msg: 'Unable to validate email address / password.'});
                error(modelErrors);
                return;
            }

            success(usr);
        });

    },

    insert : function(user, success, error)  {
        var modelErrors = [];
        user.first = user.first || '';
        user.last = user.last || '';
        user.title = user.title || '';
        user.email = user.email || '';
        user.password = user.password || '';
        user.emailLower = user.email.toLowerCase();

        if (user.title == '')
        {
            modelErrors.push({param: 'title', msg : 'Please enter your title'});
        }

        switch (user.title) {
            case 'Mr':
            case 'Mrs':
            case 'Ms':
            case 'Dr':
                break;
            default:
                modelErrors.push({param: 'title', msg : 'Please enter a valid title'});
                break;
        }

        if (user.first == '')
        {
            modelErrors.push({param: 'first', msg : 'Please enter your first name'});
        }

        if (user.last == '')
        {
            modelErrors.push({param: 'first', msg : 'Please enter your last name'});
        }

        if (!user.email.match(UtilityService.sRegexEmail))
        {
            modelErrors.push({param: 'email', msg : 'Invalid email address.'});
        }

        if (!user.password.match(UtilityService.sRegexPassword))
        {
            modelErrors.push({param: 'password', msg : 'Passwords must be at least 6 characters'});
        }

        if (modelErrors.length > 0) {
            error(modelErrors);
            return;
        }
        UserSchema.findOne({
            emailLower: user.emailLower
        }, function(err, usr) {
            if (err) {
                modelErrors.push({msg : 'Unexpected Error. Unable to create user.'});
                error(modelErrors);
                return;
            };

            if (usr) {
                modelErrors.push({param: 'email', msg : 'Email address already exists.'});
                error(modelErrors);
                return;
            }
            var newUser = new UserSchema();

            newUser.email = user.email;
            newUser.emailLower = user.emailLower;
            newUser.first = user.first;
            newUser.last = user.last;
            newUser.title = user.title;
            newUser.date = Date.now();
            newUser.salt = UtilityService.makeSalt();
            newUser.hashed_password = UtilityService.hashPassword(user.password, newUser.salt);

            newUser.save(function (err, usr) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to create user.'});
                    error(modelErrors);
                    return;
                };

                success(usr);

            });
        });

    },
    updatePassword: function (id, password, callback) {
        var modelErrors = [];
        password = password || '';

        if (!password.match(UtilityService.sRegexPassword))
        {
            modelErrors.push({param: 'password', msg : 'Passwords must be at least 8 characters and contain at least: 1 Upper Case, 1 Lower Case, 1 Special Character (!@#$&*), 1 Number'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors,null);
            return;
        }

        UserSchema.findOne({
            _id: id
        }, function(err, usr) {
            if (err) {
                modelErrors.push({msg : 'Unexpected Error. Unable to create user.'});
                callback(modelErrors,null);
                return;
            };

            if (!usr) {
                modelErrors.push({ msg : 'Unable to find User.'});
                callback(modelErrors,null);
                return;
            }

            usr.salt = UtilityService.makeSalt();
            usr.hashed_password = UtilityService.hashPassword(password, usr.salt);

            usr.save(function (err, newusr) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to save password.'});
                    callback(modelErrors,null);
                    return;
                };
                callback(null,newusr);
            });
        });

    }
}
