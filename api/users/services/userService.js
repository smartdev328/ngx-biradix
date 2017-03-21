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
    updateGuestStatsDateAdded: function(guestid, propertyid, callback) {
        var query = {_id: guestid};
        var update = {$addToSet: {guestStats: {propertyid: propertyid.toString(), dateAdded: new Date(), lastEmailed: null, lastCompleted: null}}};
        var options = {new: true};

        UserSchema.findOneAndUpdate(query, update, options, function (err, saved) {
           callback();
        });
    },
    updateGuestStatsLastEmailed: function(guestid, propertyid, callback) {
        var query = {_id: guestid, "guestStats.propertyid" : propertyid};
        var update = {"guestStats.$.lastEmailed" :  new Date()};
        var options = {new: true};

        UserSchema.findOneAndUpdate(query, update, options, function (err, saved) {
            callback();
        });
    },
    removeGuestStats: function(guestid, propertyid, callback) {
        var query = {_id: guestid};
        var update = {$pull: {guestStats: {propertyid: propertyid.toString()}}};
        var options = {new: true};

        UserSchema.findOneAndUpdate(query, update, options, function (err, saved) {
            callback();
        });
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
        var tStart = (new Date()).getTime();
        var t, tS;
        //if you pass in fields to select you are overwritting the default

        criteria.custom = criteria.select != undefined;


        async.parallel({
                permissions: function(callbackp) {
                    if (Operator.memberships.isadmin) {
                        callbackp(null,[]);
                    } else {
                        tS = (new Date()).getTime();
                        AccessService.getPermissions(Operator, ['UserManage'], function(permissions) {
                            t = (new Date()).getTime();
                            //console.log('Get UserManage Permissions is Done: ',(t-tS) / 1000, "s");

                            callbackp(null, permissions)
                        });
                    }
                },
                roles: function (callbackp) {
                    tS = (new Date()).getTime();
                    AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO','Guest'], cache: false},function(err, roles) {
                        t = (new Date()).getTime();
                        //console.log('Get Roles is Done: ',(t-tS) / 1000, "s");

                        callbackp(err, roles)
                    })
                },
                orgs: function(callbackp) {
                    tS = (new Date()).getTime();
                    OrgService.read(function (err, orgs) {
                        t = (new Date()).getTime();
                        //console.log('Get Orgs is Done: ',(t-tS) / 1000, "s");
                        callbackp(null, orgs)
                    });
                }
            }, function(err, all) {

            all.roles = JSON.parse(JSON.stringify(all.roles));
            var org;
            all.roles.forEach(function (r) {
                r.orgid = r.orgid.toString();
                org = _.find(all.orgs, function (o) {
                    return o._id.toString() == r.orgid;
                });
                r.org = org;
            })

            t = (new Date()).getTime();
            //console.log('User All is Done: ',(t-tStart) / 1000, "s");


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

            if (criteria.email) {
                query = query.where('emailLower').in(criteria.email.toLowerCase());
            }

            if (criteria.active) {
                query = query.where('active').eq(criteria.active);
            }

            if (criteria.custom) {

                if (criteria.select.indexOf("settings") == -1) {
                    criteria.select += " settings.defaultRole";
                }

                query = query.select(criteria.select);
            } else {
                query = query.select('_id first last email active date bounceReason settings.defaultRole');
            }

            query = query.sort("-date");


            query.exec(function(err, users) {

                if (users) {
                    users = JSON.parse(JSON.stringify(users));
                    var tS = (new Date()).getTime();


                    // console.log(criteria);
                    if (criteria.orgid) {
                        _.remove(all.roles, function(x) {return x.orgid.toString() != criteria.orgid.toString() })
                    }

                    if (criteria.isGuest === true) {
                        _.remove(all.roles, function(x) {return x.tags[0] != 'Guest' })
                    }

                    var roleids = _.map(all.roles,function(x) {return x._id});
                    var userids = _.map(users,function(x) {return x._id});

                    AccessService.getAllMemberships({roleids: roleids, userids: userids}, function(err, memberships) {
                        all.memberships = memberships;

                        all.memberships = JSON.parse(JSON.stringify(all.memberships));
                        all.memberships.forEach(function (m) {
                            m.userid = m.userid.toString();
                            m.roleid = m.roleid.toString();
                        });

                        var allowedOrgs = _.map(Operator.orgs, function (o) {
                            return o._id.toString()
                        });

                        t = (new Date()).getTime();
                        //console.log('Get Memberships is Done: ',(t-tS) / 1000, "s");

                        tS = (new Date()).getTime();

                        var memberships, roles;

                        users.forEach(function (x) {
                            if (!criteria.custom) {
                                x.name = x.first + ' ' + x.last;
                                delete x.first;
                                delete x.last;
                            }

                            //Get ALl memberships for this user.
                            memberships = _.filter(all.memberships, function (m) { return m.userid == x._id});
                            memberships = _.map(memberships, function(m) {return m.roleid})

                            if (memberships && memberships.length > 0) {

                                //Get the first role that matches any memberships.
                                roles = _.filter(all.roles, function (r) { return memberships.indexOf(r._id) > -1})

                                if (roles && roles.length > 0) {
                                    //filter users by role types from criteria
                                    if (criteria.roleTypes && !_.find(roles, function (x) {
                                            return criteria.roleTypes.indexOf(x.tags[0]) > -1
                                        })) {
                                        x.deleted = true;
                                    }

                                    //filter users by role orgid from criteria
                                    if (criteria.orgid && !_.find(roles, function (x) {
                                            return criteria.orgid.toString() == x.orgid.toString()
                                        })) {
                                        x.deleted = true;
                                    }

                                    if (x.settings && x.settings.defaultRole && roles.length > 1) {
                                        roles = _.sortBy(roles, function (n) {
                                            if (n._id.toString() == x.settings.defaultRole.toString()) {
                                                return "-1";
                                            }
                                            return n.org.name;
                                        })
                                    }

                                    x.roles = roles;

                                    //For Non-admins only return roles in their org
                                    if (!Operator.memberships.isadmin) {
                                        _.remove(x.roles, function (z) {
                                            return z.tags[0] != 'Guest' && allowedOrgs.indexOf(z.orgid.toString()) == -1
                                        })
                                    }

                                } else {
                                    x.deleted = true;
                                }
                            } else {
                                x.deleted = true;
                            }

                        })

                        _.remove(users, function (x) {
                            return x.deleted
                        })

                        t = (new Date()).getTime();
                        //console.log('User Loop Done: ',(t-tS) / 1000, "s");


                        t = (new Date()).getTime();
                        //console.log('User Search Total: ',(t-tStart) / 1000, "s");

                        callback(err, users)

                        for (var s in all) {
                            all[s] = null;
                            delete all[s];
                        }
                        all = null;
                    });
                } else {

                    callback(err, users)

                    for (var s in all) {
                        all[s] = null;
                        delete all[s];
                    }
                    all = null;
                }
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
                    var org = UtilityService.getOrgByUrl(resp.user.orgs, base);
                    var logo = base + "/images/organizations/" + org.logoBig;
                    var email = {
                        to: usr.email,
                        subject: 'Password recovery',
                        logo : logo,
                        template : 'password.html',
                        templateData : {first: usr.first, email: usr.email, link: base + "/p/" + token }
                    };

                    AuditService.create({type: 'reset_password', user : usr,description: 'Success: ' + usr.email, context: context})

                    UserSchema.findOneAndUpdate({_id: usr._id}, {bounceReason: undefined}, {}, function() {});
                    userBounceService.resetBounce(usr.email,function(){
                        EmailService.send(email,function(emailError,status) {
                            usr = null;
                            email = null;
                            resp = null;
                            return callback(null,true);
                        })
                    });

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
        var _this = this;
        getSysemUser(function(system) {
            _this.search(system.user,{active:true, select: "_id settings first last email bounceReason active" }, function(err,users) {
                users.forEach(function(u) {
                    defaultSettings(u,u.roles[0].org.settings);
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
                        || x.bounceReason
                        || x.roles[0].tags[0] == 'Guest'
                        || !x.active
                })
                callback(err,users);
            });
        })

    }
    ,

    updateSettings : function(Operator, user, settings, context, callback)  {
        var modelErrors = [];


        if (!user._id)
        {
            modelErrors.push({msg : 'Invalid user id.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }

        this.search(Operator,{_id: user._id, select: "settings first last email"}, function (err, users) {
            if (err || users.length == 0) {
                modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                callback(modelErrors,null);
                return;
            };

            var usr = users[0];

            //console.log(usr);

            defaultSettings(usr,users[0].roles[0].org.settings);

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

            var reminderDescription = "";

            if (usr.settings.reminders.on == true && settings.reminders.on == false) {
                reminderDescription = "On => Off";
            }
            else if (usr.settings.reminders.on == false && settings.reminders.on == true) {
                reminderDescription = "Off => On";
            }

            var leasesDescription = "";
            if (usr.settings.showLeases == true && settings.showLeases == false) {
                leasesDescription = "On => Off";
            }
            else
            if (usr.settings.showLeases == false && settings.showLeases == true) {
                leasesDescription = "Off => On";
            }

            var renewalDescription = "";
            if (usr.settings.showRenewal == true && settings.showRenewal == false) {
                renewalDescription = "On => Off";
            }
            else
            if (usr.settings.showRenewal == false && settings.showRenewal == true) {
                renewalDescription = "Off => On";
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
            // usr.markModified("settings.reminders");
            // usr.markModified("settings.tz");

                var query = {_id: usr._id};
                var update = {settings: settings};
                var options = {};

            UserSchema.findOneAndUpdate(query, update, options, function (err, usr) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                    callback(modelErrors,null);
                    return;
                };

                if (bLinkedUpdated) {
                    AuditService.create({operator: Operator, user: usr, type: 'show_unlinked', description: usr.first + ' ' + usr.last + ': ' + usr.settings.hideUnlinked === true ? 'Hide' : 'Show', context: context})
                }

                if (notsDescription) {
                    AuditService.create({operator: Operator, user: usr, type: 'user_notifications', description: usr.first + ' ' + usr.last + ': ' + notsDescription, context: context, data: nots})
                }

                if (reminderDescription) {
                    AuditService.create({operator: Operator, user: usr, type: 'user_reminders', description: usr.first + ' ' + usr.last + ': ' + reminderDescription, context: context, data: nots})
                }

                if (leasesDescription) {
                    AuditService.create({operator: Operator, user: usr, type: 'user_leased', description: usr.first + ' ' + usr.last + ': ' + leasesDescription, context: context})
                }

                if (renewalDescription) {
                    AuditService.create({operator: Operator, user: usr, type: 'user_renewal', description: usr.first + ' ' + usr.last + ': ' + renewalDescription, context: context})
                }

                if (concessionsDescription) {
                    AuditService.create({operator: Operator, user: usr, type: 'user_concessions', description: usr.first + ' ' + usr.last + ': ' + concessionsDescription, context: context})
                }

                callback(null,usr.settings);


            });

        })

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
    getUsersForSettingsApply : function(operator, orgid, setting, value, callback) {
        this.search(operator, {orgid: orgid, select: "first last settings"}, function (err, users) {
            users.forEach(function(u) {
                defaultSettings(u,u.roles[0].org.settings);

                switch (setting) {
                    case 'updates':
                       if (u.settings.notifications.on == value) {
                           u.remove = true;
                       }  else {
                           u.settings.notifications.on = value;
                       }
                       break;
                    case 'how_often':
                        if (u.settings.notifications.cron == value) {
                            u.remove = true;
                        }  else {
                            u.settings.notifications.cron = value;
                        }
                        break;
                    case 'all_properties':
                        if (u.settings.notifications.props.length != 0 && value == true) {
                            u.settings.notifications.props = [];
                        }  else {
                            u.remove = true;
                        }
                        break;
                    case 'reminders':
                        if (u.settings.reminders.on == value) {
                            u.remove = true;
                        }  else {
                            u.settings.reminders.on = value;
                        }
                        break;
                    case 'leased':
                        if (u.settings.showLeases == value) {
                            u.remove = true;
                        }  else {
                            u.settings.showLeases = value;
                        }
                        break;
                    case 'renewal':
                        if (u.settings.showRenewal == value) {
                            u.remove = true;
                        }  else {
                            u.settings.showRenewal = value;
                        }
                        break;
                    case 'detailed_concessions':
                        if (u.settings.monthlyConcessions == value) {
                            u.remove = true;
                        }  else {
                            u.settings.monthlyConcessions = value;
                        }
                        break;
                    default:
                        u.remove = true;
                }

            })

            _.remove(users, function(x) { return x.remove})

            callback(users);
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
                AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO','Guest'], cache:false},function (err, roles) {
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
                    usrobj.orgs = _.filter(all.orgs, function(x) {
                        var o = _.find(final, function(y) {return y.orgid.toString() == x._id.toString()});

                        if (o && usrobj.settings && usrobj.settings.defaultRole) {
                            if (o._id.toString() == usrobj.settings.defaultRole) {
                                x.isDefault = true;
                            }

                        }
                        return o;
                    })

                    usrobj.orgs = _.sortBy(usrobj.orgs, function (n) {
                        if (n.isDefault && n.isDefault === true) {
                            return "-1";
                        }
                        return n.name;
                    })

                }

                defaultSettings(usrobj, usrobj.orgs[0].settings);

                var minutesToExpire = 60;

                if (usr.minutesToExpire) {
                    minutesToExpire = usr.minutesToExpire;
                    delete usr.miuntesToExpire;
                }

                var key = md5(JSON.stringify(usrobj));
                redisService.set(JSON.stringify(usrobj),usrobj,minutesToExpire);

                var token = jwt.sign(key, settings.SECRET, {expiresIn: minutesToExpire * 60});

                var operator = _.clone(usrobj);

                //delete usrobj.memberships;
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

function defaultSettings(user, orgSettings) {
 //   orgSettings = orgSettings || { detailed_concessions : {}, leased: {}, renewal : {}, how_often: { default_value: "* * * * 2"}, updates: {}, reminders: {}};
 //   console.log(orgSettings);
    user.settings = user.settings || {};
    user.settings.monthlyConcessions = user.settings.monthlyConcessions || orgSettings.detailed_concessions.default_value;
    user.settings.showLeases = user.settings.showLeases || orgSettings.leased.default_value;
    user.settings.showRenewal = user.settings.showRenewal || orgSettings.renewal.default_value;
    user.settings.notifications = user.settings.notifications || {};
    user.settings.notifications.cron = user.settings.notifications.cron || orgSettings.how_often.default_value
    user.settings.notifications.props = user.settings.notifications.props || [];
    user.settings.notifications.last = user.settings.notifications.last || null;
    user.settings.notifications.on = typeof user.settings.notifications.on == 'undefined' ? orgSettings.updates.default_value : user.settings.notifications.on;

    user.settings.reminders = user.settings.reminders || {};
    user.settings.reminders.on = typeof user.settings.reminders.on == 'undefined' ? orgSettings.reminders.default_value : user.settings.reminders.on;
}