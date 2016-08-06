'use strict';

var jwt = require('jsonwebtoken');
var _ = require('lodash');
var async = require('async')
var UserSchema= require('../schemas/userSchema')
var UtilityService = require('./utilityService')
var EmailService = require('../../business/services/emailService')
var settings = require('../../../config/settings')
var OrgService = require('../../organizations/services/organizationService')
var AccessService = require('../../access/services/accessService')
var AuditService = require('../../audit/services/auditService')
var localCacheService = require('../../utilities/services/localcacheService')
var cronService = require('../../utilities/services/cronService')
var md5 = require('md5');
var redisService = require('../../utilities/services/redisService')
var userBounceService = require('./userBounceService')

module.exports = {
    defaultSettings: function(user) {
        defaultSettings(user);
    },
    updateBounce: function(email,reason,callback) {
        UserSchema.findOne(
            {
                emailLower: email.toLowerCase()
            }
            , function(err, user) {
                if (user) {
                    user.bounceReason = reason;
                    user.save(function(err, newUser) {

                        getSysemUser(function(systemUser) {
                            AuditService.create({user: newUser, operator: systemUser.user,type: 'user_bounced', description: email + ": " + reason, context: {ip: '127.0.0.1', user_agent: 'server'}})

                            callback();
                        });

                    })

                }

        });
    },
    getSystemUser : function(callback) {

        getSysemUser(callback);

    },
    search: function(Operator,criteria, callback) {

        //if you pass in fields to select you are overwritting the default
        criteria.custom = criteria.select != undefined;
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
                    AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO'], cache: true},function(err, roles) {
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

            var query = UserSchema.find();

            if (criteria._id) {
                criteria.ids = criteria.ids || [];
                criteria.ids.push(criteria._id);
            }

            if (Operator.memberships.isadmin === true) {
                if (criteria.ids) {
                    query = query.where("_id").in(criteria.ids);
                }
            }
            else {

                if (criteria.ids) {
                    all.permissions = _.intersection(all.permissions, criteria.ids);
                }

                query = query.where('_id').in(all.permissions);
            }


            if (criteria.custom) {
                query = query.select(criteria.select);
            } else {
                query = query.select('_id first last email active date bounceReason');
            }

            query = query.sort("-date");

            query.exec(function(err, users) {

                if (users) {
                    users = JSON.parse(JSON.stringify(users));
                    users.forEach(function(x) {
                        if (!criteria.custom) {
                            x.name = x.first + ' ' + x.last;
                            delete x.first;
                            delete x.last;
                            x.role = 'N/A';
                            x.company = 'N/A';
                        }

                        //Get ALl memberships for this user.
                        var membership = _.filter(all.memberships, function(m) { return m.userid.toString() == x._id.toString()})

                        //if (criteria._id &&criteria._id == "5642c28855d27c0e003bbaf2") {
                        //    console.log(membership);
                        //    console.log(_.filter(all.memberships, function(m) { return m.userid.toString() == x._id.toString()}));
                        //}

                        if (membership && membership.length > 0) {

                            //Get the first role that matches any memberships.
                            var role = _.find(all.roles, function(r) {
                                return _.find(membership, function(m) {return r._id.toString() == m.roleid.toString()});

                            })
                            //console.log("Membership",membership,"Role",role)

                            if (role) {
                                if (!criteria.custom) {
                                    x.role = role.name;
                                }
                                else {
                                    x.roleid = role._id;
                                    x.roleType = role.tags[0];
                                }

                                //remove role types after we know what actual role it is
                                if (criteria.roleTypes && criteria.roleTypes.indexOf(role.tags[0]) == -1) {
                                    x.deleted = true;
                                }

                                var company = _.find(all.orgs, function(o) {return o._id.toString() == role.orgid.toString() })
                                if (company) {
                                    if (!criteria.custom) {
                                        x.company = company.name;
                                    } else {
                                        x.orgid = company._id;
                                    }

                                    //remove role orgids if we are asking for an orgid and it doesnt match
                                    if (criteria.orgid && criteria.orgid.toString() != company._id.toString()) {
                                        x.deleted = true;
                                    }
                                }


                            }
                        }
                    })
                }

                _.remove(users, function(x) {return x.deleted})

                callback(err,users)

                for (var s in all) {
                    all[s] = null;
                    delete all[s];
                }
                all = null;
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
        var modelErrors = [];
        email = email || '';

        if (email === '')
        {
            modelErrors.push({param: 'email', msg : 'Missing email address.'});
            return callback(modelErrors,false);
        }

        var emailLower = email.toLowerCase();

        UserSchema.findOne({
                emailLower: emailLower
            }, function(err, usr) {
                if (!usr) {
                    modelErrors.push({param: 'email', msg : 'Unable to locate account with that email address.'});
                    AuditService.create({type: 'reset_password', description: 'Failed: ' + email + ' (' + modelErrors[0].msg + ')', context: context})
                    return callback(modelErrors,false);
                }

            if (!usr.active) {
                modelErrors.push({param: 'email', msg : 'This account is currently marked as inactive. Please contact your company BI:Radix admin or support@biradix.com if this is incorrect.'});
                AuditService.create({type: 'reset_password', description: 'Failed: ' + email + ' (' + modelErrors[0].msg + ')', context: context})
                return callback(modelErrors,false);
            }

                var token = jwt.sign({id: usr._id}, settings.SECRET, { expiresIn: 30 * 60 });

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
                        usr = null;
                        email = null;
                        resp = null;
                        return callback(null,true);
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
                modelErrors.push({msg: 'Your email address / password appear to be incorrect. Please verify them and try logging in again.'});
                AuditService.create({type: 'login_failed', description: user.email + ' (' + modelErrors[0].msg + ')', context: context})
                error(modelErrors);
                return;
            }

            if (!usr.active) {
                modelErrors.push({msg: 'This account is currently marked as inactive. Please contact your company BI:Radix admin or support@biradix.com if this is incorrect.'});
                AuditService.create({type: 'login_failed', description: user.email + ' (' + modelErrors[0].msg + ')', context: context})
                error(modelErrors);
                return;
            }

            if (usr.hashed_password !== UtilityService.hashPassword(user.password, usr.salt)) {
                if (usr.legacyHash && usr.legacyHash == md5(user.password)) {
                    //dont error on if legacy hash exists and matches password
                } else {
                    modelErrors.push({msg: 'Your email address / password appear to be incorrect. Please verify them and try logging in again.'});
                    AuditService.create({
                        type: 'login_failed',
                        description: user.email + ' (' + modelErrors[0].msg + ')',
                        context: context
                    })
                    error(modelErrors);
                    return;
                }
            }

            AuditService.create({type: 'login_succeeded', operator: usr, user: usr, description: usr.email, context: context})
            success(usr);
        });

    },

    updatePassword: function (id, password, context, oldpassword, callback) {
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

            if (oldpassword) {
                if (usr.hashed_password != UtilityService.hashPassword(oldpassword, usr.salt)) {
                    modelErrors.push({msg : 'Invalid current password'});
                    callback(modelErrors,null);
                    return;
                }
            }

            usr.salt = UtilityService.makeSalt();
            usr.hashed_password = UtilityService.hashPassword(password, usr.salt);
            usr.passwordUpdated = true;

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
    notificatonSent : function(callback) {

    },
    getUsersForNotifications : function(callback) {
        UserSchema.find({active:true, bounceReason : null}).select("_id settings first last email").exec(function(err, users) {
            users.forEach(function(u) {
                defaultSettings(u);
            })

            _.remove(users, function(x) {
                var s = x.settings.notifications;
                //s.last = "1/7/2016";

                var hoursSinceLast = Math.abs((new Date(s.last)).getTime() - (new Date()).getTime()) / 3600000;

                if (isNaN(hoursSinceLast)) {
                    hoursSinceLast = 24 * 7;
                }
                //console.log(hoursSinceLast)
                return  s.on == false // remove "Off"
                    || hoursSinceLast < 24 // remove anything alfready sent within 24 hours
                    || !cronService.isAllowed(s.cron) // remove when cron is not allowed
            })
            callback(err,users);
        });
    }
    ,

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

            defaultSettings(usr);

            var bLinkedUpdated = usr.settings.hideUnlinked != settings.hideUnlinked;

            var nots = [];
            var notsDescription = "";

            if (usr.settings.notifications.on == true && settings.notifications.on == false) {
                notsDescription = "On => Off";
            }
            else if (usr.settings.notifications.on == false && settings.notifications.on == true) {
                notsDescription = "Off => On";
            }
            else {
                if (usr.settings.notifications.cron != settings.notifications.cron) {
                    notsDescription = "Schedule"
                }

                if (!_.isEqual(usr.settings.notifications.props.sort(), settings.notifications.props.sort()) ) {
                    if (notsDescription) {
                        notsDescription += ", ";
                    }
                    notsDescription += "Properties";
                }

                if (notsDescription) {
                    notsDescription += " Updated";
                }
            }

            var leasesDescription = "";
            if (usr.settings.showLeases == true && settings.showLeases == false) {
                leasesDescription = "On => Off";
            }
            else
            if (usr.settings.showLeases == false && settings.showLeases == true) {
                leasesDescription = "Off => On";
            }

            var concessionsDescription = "";
            if (usr.settings.monthlyConcessions == true && settings.monthlyConcessions == false) {
                concessionsDescription = "On => Off";
            }
            else
            if (usr.settings.monthlyConcessions == false && settings.monthlyConcessions == true) {
                concessionsDescription = "Off => On";
            }

            usr.settings = settings
            usr.markModified("settings.notifications");
            usr.markModified("settings.tz");

            usr.save(function (err, usr) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                    callback(modelErrors,null);
                    return;
                };

                if (bLinkedUpdated) {
                    AuditService.create({operator: usr, user: usr, type: 'show_unlinked', description: usr.settings.hideUnlinked === true ? 'Hide' : 'Show', context: context})
                }

                if (notsDescription) {
                    AuditService.create({operator: usr, user: usr, type: 'user_notifications', description: notsDescription, context: context, data: nots})
                }

                if (leasesDescription) {
                    AuditService.create({operator: usr, user: usr, type: 'user_leased', description: leasesDescription, context: context})
                }

                if (concessionsDescription) {
                    AuditService.create({operator: usr, user: usr, type: 'user_concessions', description: concessionsDescription, context: context})
                }

                callback(null,usr.settings);


            });


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

                AuditService.create({operator: operator, user: saved, type: 'user_status', revertedFromId : revertedFromId, description: saved.first + ' ' + saved.last + ': ' + (user.active ? "Inactive => Active" : "Active => Inactive"), context: context, data : [{description: "Previous: " + (user.active ? "Inactive" : "Active"), status: !user.active}]})

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
                AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO'], cache:true},function (err, roles) {
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

                defaultSettings(usrobj);

                var minutesToExpire = 60;

                var key = md5(JSON.stringify(usrobj));
                redisService.set(JSON.stringify(usrobj),usrobj,60);

                var token = jwt.sign(key, settings.SECRET, {expiresIn: minutesToExpire * 60});





                var operator = _.clone(usrobj);

                delete usrobj.memberships;
                delete usrobj.ip;
                delete usrobj.useragent;


                callback({token: token, user: usrobj, operator: operator});

            });
        })
}

function getSysemUser (callback) {
    var key = "systemUser";

    var user = localCacheService.get(key);

    if (user) {
        callback(user);
        user = null;
        return;
    }

    UserSchema.findOne({
        isSystem: true
    }, function(err, user) {
        if (err) {
            throw new Error(err);
        }
        getFullUser(user, function(obj) {
            obj.user.memberships = {isadmin:true};
            localCacheService.set(key, obj, 120)
            callback(obj);
            obj = null;
            user = null;
            return;
        });

    })
}

function defaultSettings(user) {
    user.settings.monthlyConcessions = user.settings.monthlyConcessions || false;
    user.settings.showLeases = user.settings.showLeases || false;
    user.settings.notifications = user.settings.notifications || {};
    user.settings.notifications.cron = user.settings.notifications.cron || "* * * * 2"
    user.settings.notifications.props = user.settings.notifications.props || [];
    user.settings.notifications.last = user.settings.notifications.last || null;
    user.settings.notifications.on = typeof user.settings.notifications.on == 'undefined' ? true : user.settings.notifications.on;
}