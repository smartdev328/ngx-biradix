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
var AuditService = require('../../audit/services/auditService')

module.exports = {
    search: function(Operator,criteria, callback) {
        async.parallel({
                permissions: function(callbackp) {
                    if (Operator.memberships.isadmin) {
                        callbackp(null,[]);
                    } else {
                        AccessService.getPermissions(Operator, ['UserManage'], function(permissions) {
                            callbackp(null, permissions)
                        });
                    }
                },
                roles: function (callbackp) {
                    AccessService.getRoles(function(err, roles) {
                        callbackp(err, roles)
                    })
                },
                memberships: function (callbackp) {
                    AccessService.getAllMemberships(function(err, memberships) {
                        callbackp(err, memberships)
                    })
                } ,
                orgs: function(callbackp) {
                    OrgService.read(function (err, orgs) {
                        callbackp(null, orgs)
                    });
                }
            }, function(err, all) {

            var query;
            if (Operator.memberships.isadmin) {
                query = UserSchema.find();
            }
            else {
                query = UserSchema.find({'_id': {$in: all.permissions}});
            }

            query = query.select('_id first last email active date');

            query = query.sort("-date");

            query.exec(function(err, users) {

                if (users) {

                    users = JSON.parse(JSON.stringify(users));
                    users.forEach(function(x) {
                        x.name = x.first + ' ' + x.last;
                        delete x.first;
                        delete x.last;
                        x.role = 'N/A';
                        x.company= 'N/A';

                        var membership = _.find(all.memberships, function(m) { return m.userid.toString() == x._id.toString()})

                        if (membership) {
                            var role = _.find(all.roles, function(r) {return r._id.toString() == membership.roleid.toString()})
                            if (role) {
                                x.role = role.name;
                                var company = _.find(all.orgs, function(o) {return o._id.toString() == role.orgid.toString() })
                                if (company) {
                                    x.company = company.name;
                                }
                            }
                        }
                    })
                }
                callback(err,users)
            })

        });
    },
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
    resetPassword: function(email,base,context,callback) {
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
                    AuditService.create({type: 'reset_password', description: 'Failed: ' + email, context: context})
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

                    AuditService.create({type: 'reset_password', user : usr,description: 'Success: ' + usr.email, context: context})

                    EmailService.send(email,function(emailError,status) {
                        return callback(true);
                    })
                })


            }
        )

    },
    login : function(user, context, success, error) {
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
            AuditService.create({type: 'login_failed', description: user.email + ' (' + modelErrors[0].msg + ')', context: context})
            return;
        }

        UserSchema.findOne({
                emailLower: user.emailLower,
                isSystem: false
            }, function(err, usr) {

            if (err) {
                modelErrors.push({msg: 'Unexpected Error. Unable to login.'});
                AuditService.create({type: 'login_failed', description: user.email + ' (' + modelErrors[0].msg + ')', context: context})
                error(modelErrors);
                return;
            }

            if (!usr) {
                modelErrors.push({msg: 'Unable to validate email address / password.'});
                AuditService.create({type: 'login_failed', description: user.email + ' (' + modelErrors[0].msg + ')', context: context})
                error(modelErrors);
                return;
            }

            if (usr.hashed_password !== UtilityService.hashPassword(user.password, usr.salt)) {
                modelErrors.push({msg: 'Unable to validate email address / password.'});
                AuditService.create({type: 'login_failed', description: user.email + ' (' + modelErrors[0].msg + ')', context: context})
                error(modelErrors);
                return;
            }

            if (!usr.active) {
                modelErrors.push({msg: 'Your account has been deactivated.'});
                AuditService.create({type: 'login_failed', description: user.email + ' (' + modelErrors[0].msg + ')', context: context})
                error(modelErrors);
                return;
            }

            AuditService.create({type: 'login_succeeded', operator: usr, user: usr, description: usr.email, context: context})
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

            AccessService.getRoles(function(err, roles) {
                var CMs = [];
                var permissions = [];

                var userRole = _.find(roles, function(x) {return x._id.toString() == user.roleid.toString()});

                if (userRole && userRole.orgid) {
                    var orgid = userRole.orgid;
                    //if org of property is provided, assign manage to all CMs for that org
                    CMs = _.filter(roles, function(x) {return x.orgid == orgid.toString() && x.tags.indexOf('CM') > -1})

                    CMs.forEach(function(x) {
                        permissions.push({executorid: x._id.toString(), allow: true, type: 'UserManage'})
                    })
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
                newUser.active = true;
                newUser.settings = {
                    hideUnlinked: false
                }

                newUser.save(function (err, usr) {
                    if (err) {
                        modelErrors.push({msg: 'Unexpected Error. Unable to create user.'});
                        error(modelErrors);
                        return;
                    }
                    ;

                    var membership = {userid: usr._id, roleid: user.roleid}

                    AccessService.assignMembership(membership, function(err, obj) {

                        if (permissions.length > 0 ) {
                            permissions.forEach(function(x) {
                                x.resource = usr._id.toString();
                            })
                        }

                        async.eachLimit(permissions, 10, function(permission, callbackp){
                            AccessService.createPermission(permission, function (err, perm) {
                                callbackp(err, perm)
                            });
                        }, function(err) {
                            success(usr);
                        });
                    })


                });
            });
        });

    },
    updatePassword: function (id, password, context, callback) {
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
                AuditService.create({operator: usr, user: usr, type: 'password_updated', description: usr.email, context: context})
                callback(null,newusr);
            });
        });

    },
    updateSettings : function(Operator, settings, context, callback)  {
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

            var bLinkedUpdated = usr.settings.hideUnlinked != settings.hideUnlinked;

            usr.settings = settings

            usr.save(function (err, usr) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                    callback(modelErrors,null);
                    return;
                };

                if (bLinkedUpdated) {
                    AuditService.create({operator: usr, user: usr, type: 'show_unlinked', description: usr.settings.hideUnlinked === true ? 'Hide' : 'Show', context: context})
                }
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

    },
    updateActive : function(operator, user, context, revertedFromId, callback)  {
        var modelErrors = [];

        if (!user.id)
        {
            modelErrors.push({msg : 'Invalid user id.'});
        }

        if (user.active === null)
        {
            modelErrors.push({param: 'active', msg : 'Missing active status.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }
        var query = {_id: user.id};
        var update = {active: user.active};
        var options = {new: true};


        UserSchema.findOne(query, function(err, old) {
            if (old.active === user.active) {
                modelErrors.push({msg : 'User is already ' + (old.active ? 'Active' : 'Inactive')});
                callback(modelErrors, null);
                return;
            }
            UserSchema.findOneAndUpdate(query, update, options, function(err, saved) {

                if (err) {
                    modelErrors.push({msg : 'Unable to update user.'});
                    callback(modelErrors, null);
                    return;
                }

                AuditService.create({operator: operator, user: saved, type: 'user_status', revertedFromId : revertedFromId, description: user.active ? "Inactive => Active" : "Active => Inactive", context: context, data : [{description: "Previous: " + (user.active ? "Inactive" : "Active"), status: !user.active}]})

                return callback(err, saved)
            })

        })

    },
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