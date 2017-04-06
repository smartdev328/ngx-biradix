'use strict';
var generatePassword = require('password-generator');
var _ = require('lodash');
var async = require('async')
var UserSchema= require('../schemas/userSchema')
var UtilityService = require('./utilityService')
var userBounceService = require('./userBounceService')
var EmailService = require('../../business/services/emailService')
var OrgService = require('../../organizations/services/organizationService')
var AccessService = require('../../access/services/accessService')
var AuditService = require('../../audit/services/auditService')

module.exports = {
    updateMe : function(operator, context, user, callback)  {
        var modelErrors = [];
        initUser(user)

        if (!operator._id)
        {
            modelErrors.push({msg : 'Invalid user id.'});
        }

        validateContact(user, modelErrors);

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }

        getUserandCheckforDupe(user.emailLower,operator._id, function(errors, usr) {
            if (errors.length > 0) {
                callback(errors, null);
                return;
            }

            var changes = getChangesForAudit(usr, user);

            populateBaseFields(operator, usr, user, true);


            if (usr.bounceReason) {
                usr.bounceReason = undefined;
            }

            userBounceService.resetBounce(usr.email,function(){});
            
            usr.save(function (err, usr) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to update user.'});
                    callback(modelErrors,null);
                    return;
                };

                if (changes.length > 0) {
                    var audit = {
                        operator: operator,
                        revertedFromId : null,
                        user: usr,
                        type: 'user_updated',
                        description: usr.first + ' ' + usr.last,
                        context: context,
                        data: changes
                    };

                    AuditService.create(audit, function() {})

                    audit = null;
                    changes = null;
                }

                callback(null,usr);
            });

        })



    },
    update : function(operator,context, revertedFromId, user, callback)  {
        var modelErrors = [];

        initUser(user)

        validateContact(user, modelErrors);

        if (!user.roleids || ! user.roleids.length)
        {
            modelErrors.push({param: 'roleid', msg : 'Please select the role.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors,null);
            return;
        }

        getUserandCheckforDupe(user.emailLower,user._id, function(errors, usr) {
            if (errors.length > 0) {
                callback(errors, null);
                return;
            }

            var changes = getChangesForAudit(usr, user);

            populateBaseFields(operator, usr, user, true);

            getHelpers(user.emailLower, function(err, all) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to update user.'});
                    callback(modelErrors, null);
                    return;
                };


                //get all current roleids
                //If non-admin only get roleids for their org so they do not remove orgs they dont have access to
                var currentroleids = _.filter(all.memberships, function(m) {
                    return m.userid.toString() == user._id.toString() &&
                    _.find(all.roles, function(r) { return r._id.toString() == m.roleid.toString() && (r.tags[0] == 'Guest' || operator.memberships.isadmin === true || operator.orgs[0]._id.toString() == r.orgid.toString())})
                });


                currentroleids = _.map(currentroleids,function(x) {return x.roleid.toString()});

                //Find roles that were removed and roles that were added
                var aAdded = _.difference(user.roleids, currentroleids);
                var aRemoved = _.difference(currentroleids,user.roleids);


                var bRoleChanged = aAdded.length > 0 || aRemoved.length > 0;

                var permissions = [];
                var removePermissions = [];


                // console.log(currentroleids, aAdded, aRemoved);
                //
                // modelErrors.push({msg: 'Test.'});
                // callback(modelErrors, null);
                // return;

                if (bRoleChanged) {
                    var userRoles = updateNewRole(aAdded, all, permissions);
                    var removedRoles = removeOldRole(aRemoved, all, removePermissions);

                    userRoles = _.map(userRoles, function(x) { return x.org.name + " - " + x.name}).join(", ");
                    removedRoles = _.map(removedRoles, function(x) { return x.org.name + " - " + x.name}).join(", ");

                    var description = "";
                    if (removedRoles) {
                        description = "Removed: " + removedRoles
                    }

                    if (userRoles) {

                        if (description) {
                            description +=", ";
                        }
                        description += "Added: " + userRoles;
                    }
                    changes.push({description: description, field: 'roleids', added: aAdded, removed: aRemoved})
                }


                if (usr.bounceReason) {
                    usr.bounceReason = undefined;
                }

                userBounceService.resetBounce(usr.email,function(){});

                if (user.defaultRole) {
                    usr.settings.defaultRole = user.defaultRole.toString();
                }

                usr.save(function (err, usr) {
                    if (err) {
                        modelErrors.push({msg: 'Unexpected Error. Unable to update user.'});
                        callback(modelErrors, null);
                        return;
                    };

                    if (changes.length > 0) {
                        var audit = {
                            operator: operator,
                            revertedFromId : revertedFromId,
                            user: usr,
                            type: 'user_updated',
                            description: usr.first + ' ' + usr.last,
                            context: context,
                            data: changes
                        };

                        AuditService.create(audit, function() {})
                    }

                    if (bRoleChanged) {
                        removeUserFromRole(usr._id,aRemoved, removePermissions, function() {
                            addUserToRole(usr._id,aAdded, permissions, function() {
                                callback(null, usr);
                            });
                        });
                    } else {
                        callback(null, usr);
                    }
                });
            })

        })


    },
    insert : function(operator,context, user, base, callback)  {
        var modelErrors = [];

        initUser(user)

        validateContact(user, modelErrors);

        if (!user.password.match(UtilityService.sRegexPassword))
        {
            modelErrors.push({param: 'password', msg : 'Passwords must be at least 8 characters'});
        }

        if (!user.roleids || !user.roleids.length)
        {
            modelErrors.push({param: 'roleid', msg : 'Please select a role.'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors,null);
            return;
        }

        getHelpers(user.emailLower, function(err, all) {
            if (err) {
                modelErrors.push({msg : 'Unexpected Error. Unable to create user.'});
                callback(modelErrors,null);
                return;
            };

            if (all.dupe) {
                modelErrors.push({param: 'email', msg : 'Email address already exists.'});
                callback(modelErrors,null);
                return;
            }

            var permissions = [];
            var userRoles = updateNewRole(user.roleids, all, permissions);

            var newUser = new UserSchema();

            populateBaseFields(operator, newUser, user, false);

            newUser.date = user.date || Date.now();
            newUser.salt = UtilityService.makeSalt();
            newUser.hashed_password = UtilityService.hashPassword(user.password, newUser.salt);
            newUser.isSystem = (user.isSystem === true) || false;
            newUser.active = user.active === false ? false : true;
            newUser.settings = {
                hideUnlinked: (user.hideUnlinked === true) || false
            }
            newUser.legacyHash = user.legacyHash
            newUser.passwordUpdated = (user.passwordUpdated === true) || false;

            if (user.defaultRole) {
                newUser.settings.defaultRole = user.defaultRole.toString();
            }

            newUser.save(function (err, usr) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to create user.'});
                    callback(modelErrors,null);
                    return;
                }
                ;

                addUserToRole(usr._id,user.roleids, permissions, function() {
                    //Log for Audit async if not creating system users

                    var creator = "";

                    if (operator) {
                        var roles = _.map(userRoles, function(x) { return x.org.name + " - " + x.name}).join(", ");
                        var data = [{description: "Email: " + usr.email}, {description: "Role(s): " + roles}]
                        AuditService.create({
                            operator: operator,
                            user: usr,
                            type: 'user_created',
                            description: usr.first + ' ' + usr.last,
                            context: context,
                            data: data
                        })

                        if (!operator.memberships.isadmin) {
                            creator = " (" + operator.first + " " + operator.last + ")"
                        }
                    }

                    //Email password async
                    if (user.emailPassword) {

                        var org = userRoles[0].org;

                        base = base.replace("platform",org.subdomain)

                        var logo = base + "/images/organizations/" + org.logoBig;

                        var email = {
                            to: usr.email,
                            subject: org.name + creator + " has created a new account for you at BI:Radix",
                            logo : logo,
                            template : 'create.html',
                            templateData : {first: usr.first, email: usr.email, link: base, password: user.password }
                        };

                        // console.log(email);


                        EmailService.send(email,function(emailError,status) {
                        })
                    }

                    //Give yourself access to manage yourself
                    AccessService.createPermission({executorid: usr._id, resource: usr._id,allow: true,type: 'UserManage',direct: true}, function () {});

                    //Allow to manage new user so a BM can add properties to created BM
                    if (operator) {
                        AccessService.createPermission({
                            executorid: operator._id,
                            resource: usr._id,
                            allow: true,
                            type: 'UserManage',
                            direct: true
                        }, function () {
                        });
                    }

                    //Done
                    callback(null,usr);
                })
            });
        });
    },
}

function validateContact(user, modelErrors) {
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

}

function initUser(user) {
    user.first = user.first || '';
    user.last = user.last || '';
    user.title = user.title || '';
    user.email = user.email || '';
    user.password = user.password || generatePassword(8,false);
    user.emailLower = user.email.toLowerCase();
    user.emailPassword = user.emailPassword || false;
}

function getUserandCheckforDupe(emailLower, id, callback) {
    var modelErrors = [];

    UserSchema.findOne({
        _id: id
    }, function(err, usr) {
        if (err || !usr) {
            modelErrors.push({msg: 'Unexpected Error. Unable to update user.'});
            callback(modelErrors, null);
            return;
        }
        ;


        UserSchema.findOne({emailLower: emailLower, _id: {'$ne': id}}, function (err, dupeuser) {
            if (dupeuser) {
                modelErrors.push({param: 'email', msg: 'Email address already exists.'});
                callback(modelErrors, null);
                return;
            }

            callback(modelErrors, usr);
        });
    });
}

function populateBaseFields(operator, oldUser, newUser, isUpdate) {
    if (isUpdate && operator.permissions.indexOf('Users/UpdateEmail') == -1) {
        newUser.email = oldUser.email;
        newUser.emailLower = oldUser.emailLower;
    }

    oldUser.email = newUser.email;
    oldUser.emailLower = newUser.emailLower;
    oldUser.first = newUser.first;
    oldUser.last = newUser.last;
}

function getHelpers(emailLower, callback) {
    async.parallel({
        dupe : function(callbackp) {

            if (emailLower) {
                UserSchema.findOne({
                    emailLower: emailLower
                }, callbackp);
            }
            else {
                callbackp(null,null)
            }
        },
        roles : function(callbackp) {
            AccessService.getOrgRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO','Guest']},callbackp);
        },

        memberships: function (callbackp) {
            AccessService.getAllMemberships({},callbackp)
        } ,
    },function(err, all) {
        callback(err,all)
    });
}

function removeOldRole(roleids, all, permissions) {
    if (!roleids.length) {
        return [];
    }
    roleids = _.map(roleids, function(x) {return x.toString()});

    var userRoles = _.filter(all.roles, function(x) {return roleids.indexOf(x._id.toString()) > -1});

    if (userRoles && userRoles.length > 0) {

        //Remove all permissions
        var rolesToAddPermission = _.filter(all.roles, function(x) {return _.find(userRoles, function(y) {return x.orgid.toString() == y.orgid.toString() })})

        rolesToAddPermission.forEach(function(x) {
            permissions.push({executorid: x._id.toString(), allow: true, type: 'UserManage'})
        })

        userRoles = JSON.parse(JSON.stringify(userRoles));


    } else {
        throw new Error("Should not get here")
    }

    return userRoles;

}

function updateNewRole(roleids, all, permissions) {
    if (!roleids.length) {
        return [];
    }
    roleids = _.map(roleids, function(x) {return x.toString()});

    var userRoles = _.filter(all.roles, function(x) {return roleids.indexOf(x._id.toString()) > -1});


    if (userRoles && userRoles.length > 0) {
        //All CMs for the orgs of the user get access to the new user
        var rolesToAddPermission = _.filter(all.roles, function(x) {return _.find(userRoles, function(y) {return x.orgid.toString() == y.orgid.toString() }) && x.tags.indexOf('CM') > -1})

        ////All RMs for the org get access to the new user if new user is RM
        //if (userRole.tags.indexOf("RM") > -1) {
        //    rolesToAddPermission = rolesToAddPermission.concat(_.filter(all.roles, function (x) {
        //        return x.orgid == orgid && x.tags.indexOf('RM') > -1
        //    }))
        //}
        //
        ////All RMs, BMs for the org get access to the new user if new user is BM
        //if (userRole.tags.indexOf("BM") > -1) {
        //    rolesToAddPermission = rolesToAddPermission.concat(_.filter(all.roles, function (x) {
        //        return x.orgid == orgid && (x.tags.indexOf('RM') > -1 || x.tags.indexOf('BM') > -1)
        //    }))
        //}
        //
        ////All RMs, BMs, POs for the org get access to the new user if new user is PO
        //if (userRole.tags.indexOf("PO") > -1) {
        //    rolesToAddPermission = rolesToAddPermission.concat(_.filter(all.roles, function (x) {
        //        return x.orgid == orgid && (x.tags.indexOf('RM') > -1 || x.tags.indexOf('BM') > -1 || x.tags.indexOf('PO') > -1)
        //    }))
        //}

        rolesToAddPermission.forEach(function(x) {
            permissions.push({executorid: x._id.toString(), allow: true, type: 'UserManage'})
        })

        userRoles = JSON.parse(JSON.stringify(userRoles));

    } else {
        throw new Error("Should not get here")
    }

    return userRoles;
}

function addUserToRole(id, roleids, permissions, callback) {

    //console.log(permissions);

    if (!roleids || !roleids.length) {
        return callback();
    }

    var memberships = _.map(roleids, function(x) { return  {userid: id, roleid: x} });

    //You need membership so the user gets access to everything in that role and is associated with that role
    async.eachLimit(memberships, 10, function(membership, callbackp){
        AccessService.assignMembership(membership, function(err, obj) {
            callbackp(err, obj)
        });
    }, function(err) {
        if (permissions.length > 0 ) {
            permissions.forEach(function(x) {
                x.resource = id.toString();
            })
        }

        //you need permissions so everyone in the upline has access to modify you.
        async.eachLimit(permissions, 10, function(permission, callbackp){
            AccessService.createPermission(permission, function (err, perm) {
                callbackp(err, perm)
            });
        }, function(err) {
            callback();
        });

    });

}

function removeUserFromRole(id, roleids, permissions, callback) {

    if (!roleids || !roleids.length) {
        return callback();
    }

    var memberships = _.map(roleids, function(x) { return  {userid: id, roleid: x} });

    //You need membership so the user gets access to everything in that role and is associated with that role
    async.eachLimit(memberships, 10, function(membership, callbackp){
        AccessService.revokeMembership(membership, function(err, obj) {
            callbackp(err, obj)
        });
    }, function(err) {
        if (permissions.length > 0 ) {
            permissions.forEach(function(x) {
                x.resource = id.toString();
            })
        }

        async.eachLimit(permissions, 10, function(permission, callbackp){
            AccessService.deletePermission(permission, function (err, perm) {
                callbackp(err, perm)
            });
        }, function(err) {
            callback();
        });
    });
}

function getChangesForAudit(oldUser, newUser) {
    var changes = [];

    if (oldUser.first != newUser.first) {
        changes.push({description: "First Name: " + oldUser.first + " => " + newUser.first, field: 'first', old_value: oldUser.first})
    }

    if (oldUser.last != newUser.last) {
        changes.push({description: "Last Name: " + oldUser.last + " => " + newUser.last, field: 'last', old_value: oldUser.last})
    }

    if (oldUser.email != newUser.email) {
        changes.push({description: "Email Address: " + oldUser.email + " => " + newUser.email, field: 'email', old_value: oldUser.email})
    }

    return changes;
}

