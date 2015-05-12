'use strict';

var jwt = require('jsonwebtoken');
var _ = require('lodash');
var UserSchema= require('../schemas/userSchema')
var UtilityService = require('./utilityService')
var EmailService = require('../../business/services/emailService')
var settings = require('../../../config/settings')
var async = require('async')
var OrgService = require('../../organizations/services/organizationService')
var AccessService = require('../../access/services/accessService')

module.exports = {
    getUserById: function(id, callback) {
        UserSchema.findOne({
            _id: id
        }, callback)
    },
    getFullUser: function (usr, callback) {
        getFullUser(usr, callback);
    },
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
    resetPassword: function(email,base,callback) {
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

                var token = jwt.sign({id: usr._id}, settings.SECRET, { expiresInSeconds: 30 * 60 });

                getFullUser(usr, function(resp) {
                    var logo = base + "/images/organizations/" + resp.user.org.logoBig;
                    var email = {
                        to: usr.email,
                        subject: 'Password recovery',
                        logo : logo,
                        template : 'password.html',
                        templateData : {first: usr.first, email: usr.email, link: base + "/p/" + token }
                    };

                    EmailService.send(email,function(emailError,status) {
                        return callback(true);
                    })
                })


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
                emailLower: user.emailLower,
                isSystem: false
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
            modelErrors.push({param: 'password', msg : 'Passwords must be at least 8 characters'});
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
            newUser.isSystem = user.isSystem || false;
            newUser.settings = {
                hideUnlinked : false
            }

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
            modelErrors.push({param: 'password', msg : 'Passwords must be at least 8 characters.'});
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

    },
    updateSettings : function(Operator, settings, callback)  {
        var modelErrors = [];


        if (!Operator._id)
        {
            modelErrors.push({msg : 'Invalid user id.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }
        UserSchema.findOne({
            _id: Operator._id
        }, function(err, usr) {
            if (err || !usr) {
                modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                callback(modelErrors,null);
                return;
            };
            usr.settings = settings

            usr.save(function (err, usr) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                    callback(modelErrors,null);
                    return;
                };
                callback(null,usr.settings);
            });


        });

    },
    updateMe : function(Operator, user, callback)  {
        var modelErrors = [];
        user.email = user.email || '';
        user.emailLower = user.email.toLowerCase();
        user.first = user.first || '';
        user.last = user.last || '';

        if (!Operator._id)
        {
            modelErrors.push({msg : 'Invalid user id.'});
        }

        if (user.first === '')
        {
            modelErrors.push({param: 'first', msg : 'First name is required.'});
        }

        if (user.last === '')
        {
            modelErrors.push({param: 'last', msg : 'Last name is required.'});
        }

        if (!user.email.match(UtilityService.sRegexEmail))
        {
            modelErrors.push({param: 'email', msg : 'Invalid email address.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }
        UserSchema.findOne({
            _id: Operator._id
        }, function(err, usr) {
            if (err || !usr) {
                modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                callback(modelErrors,null);
                return;
            };

            if (Operator.permissions.indexOf('Users/UpdateEmail') == -1) {
                user.email = usr.email;
                user.emailLower = usr.emailLower;
            }

            UserSchema.findOne({emailLower: user.emailLower, _id: {'$ne': Operator._id }},function(err, dupeuser) {
                if (dupeuser) {
                    modelErrors.push({param: 'email', msg : 'Email address already exists.'});
                    callback(modelErrors,null);
                    return;
                }
                usr.email = user.email;
                usr.emailLower = user.emailLower;
                usr.first = user.first;
                usr.last = user.last;

                usr.save(function (err, usr) {
                    if (err) {
                        modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                        callback(modelErrors,null);
                        return;
                    };
                    callback(null,usr);
                });

            })

        });

    }
}


function getFullUser(usr, callback) {
    var usrobj = UtilityService.getPublicJSON(usr);
    async.parallel({
            memberships: function(callbackp) {
                AccessService.getMemberships(usr._id,function(err,memberships) {
                    callbackp(null, memberships)
                });
            },
            userroles: function(callbackp) {
                AccessService.getAssignedRoles(usrobj._id, function(err, userroles) {
                    userroles = JSON.parse(JSON.stringify(userroles))
                    callbackp(null, userroles)
                });
            },
            roles: function(callbackp) {
                AccessService.getRoles(function (err, roles) {
                    callbackp(null, roles)
                });
            },
            orgs: function(callbackp) {
                OrgService.read(function (err, orgs) {
                    callbackp(null, orgs)
                });
            }
        }
        ,function(err, all) {
            delete usrobj.date;
            delete usrobj.__v;
            usrobj.memberships = all.memberships;
            usrobj.settings = usrobj.settings || {}
            //usrobj.useragent = req.headers['user-agent'];
            //usrobj.ip = req.connection.remoteAddress;

            //permissions need memberships
            AccessService.getPermissions(usrobj, ['Execute'], function(permissions) {
                usrobj.permissions = permissions;

                var final = _.filter(all.roles, function(x) {
                    return all.userroles.indexOf(x._id.toString()) > -1
                })
                usrobj.roles = _.pluck(final,'name');

                if (final.length > 0) {
                    usrobj.org = _.find(all.orgs, function(x) {
                        return final[0].orgid.toString() == x._id.toString();
                    })
                }

                var token = jwt.sign(usrobj, settings.SECRET, {expiresInSeconds: 60 * 60});

                delete usrobj.memberships;
                delete usrobj.ip;
                delete usrobj.useragent;

                callback({token: token, user: usrobj});

            });
        })
}