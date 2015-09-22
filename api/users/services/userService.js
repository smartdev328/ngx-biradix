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

module.exports = {
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
                query = query.select('_id first last email active date');
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

                        var membership = _.find(all.memberships, function(m) { return m.userid.toString() == x._id.toString()})

                        if (membership) {
                            var role = _.find(all.roles, function(r) {return r._id.toString() == membership.roleid.toString()})
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
                        usr = null;
                        email = null;
                        resp = null;
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

                var token = jwt.sign(usrobj, settings.SECRET, {expiresInSeconds: 60 * 60});

                delete usrobj.memberships;
                delete usrobj.ip;
                delete usrobj.useragent;

                callback({token: token, user: usrobj});

            });
        })
}