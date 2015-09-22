'use strict';
var generatePassword = require('password-generator');
var _ = require('lodash');
var async = require('async')
var UserSchema= require('../schemas/userSchema')
var UtilityService = require('./utilityService')
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

        if (!user.roleid)
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

                //get roleid from users
                var membership = _.find(all.memberships, function(m) { return m.userid.toString() == user._id.toString()})

                var bRoleChanged = membership.roleid.toString() != user.roleid.toString();

                var permissions = [];
                var removePermissions = [];
                var userRole = {};
                var removedRole = {};

                if (bRoleChanged) {
                    userRole = updateNewRole(user.roleid, all, permissions);
                    removedRole = removeOldRole(membership.roleid.toString(), all, removePermissions);
                    changes.push({description: "Role: " + removedRole.org.name + ": " + removedRole.name + " => " + userRole.org.name + ": " + userRole.name, field: 'roleid', old_value: removedRole._id.toString()})
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
                        removeUserFromRole(usr._id,membership.roleid.toString(), removePermissions, function() {
                            addUserToRole(usr._id,user.roleid, permissions, function() {
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

        if (!user.roleid)
        {
            modelErrors.push({param: 'roleid', msg : 'Please select the role.'});
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
            var userRole = updateNewRole(user.roleid, all, permissions);

            var newUser = new UserSchema();

            populateBaseFields(operator, newUser, user, false);

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
                    callback(modelErrors,null);
                    return;
                }
                ;

                addUserToRole(usr._id,user.roleid, permissions, function() {
                    //Log for Audit async if not creating system users

                    if (operator) {
                        var data = [{description: "Email: " + usr.email}, {description: "Role: " + userRole.org.name + ": " + userRole.name}]
                        AuditService.create({
                            operator: operator,
                            user: usr,
                            type: 'user_created',
                            description: usr.first + ' ' + usr.last,
                            context: context,
                            data: data
                        })
                    }

                    //Email password async
                    if (user.emailPassword) {
                        var logo = base + "/images/organizations/" + userRole.org.logoBig;
                        var email = {
                            to: usr.email,
                            subject: operator.org.name + " has created a new account for you at BI:radix",
                            logo : logo,
                            template : 'create.html',
                            templateData : {first: usr.first, email: usr.email, link: base, password: user.password }
                        };


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
            AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO'], cache:true},callbackp);
        },
        orgs: function(callbackp) {
            OrgService.read(callbackp)
        },
        memberships: function (callbackp) {
            AccessService.getAllMemberships(callbackp)
        } ,
    },function(err, all) {
        callback(err,all)
    });
}

function removeOldRole(roleid, all, permissions) {
    var userRole = _.find(all.roles, function(x) {return x._id.toString() == roleid.toString()});

    if (userRole && userRole.orgid) {
        var orgid = userRole.orgid.toString();


        //Remove all permissions
        var rolesToAddPermission = _.filter(all.roles, function(x) {return x.orgid == orgid})

        rolesToAddPermission.forEach(function(x) {
            permissions.push({executorid: x._id.toString(), allow: true, type: 'UserManage'})
        })

        userRole = JSON.parse(JSON.stringify(userRole));

        userRole.org = _.find(all.orgs, function(x) {return x._id.toString() == orgid});
    } else {
        throw new Error("Should not get here")
    }

    return userRole;

}

function updateNewRole(roleid, all, permissions) {
    var userRole = _.find(all.roles, function(x) {return x._id.toString() == roleid.toString()});

    if (userRole && userRole.orgid) {
        var orgid = userRole.orgid.toString();


        //All CMs for the org get access to the new user
        var rolesToAddPermission = _.filter(all.roles, function(x) {return x.orgid == orgid && x.tags.indexOf('CM') > -1})

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

        userRole = JSON.parse(JSON.stringify(userRole));

        userRole.org = _.find(all.orgs, function(x) {return x._id.toString() == orgid});
    } else {
        throw new Error("Should not get here")
    }

    return userRole;
}

function addUserToRole(id, roleid, permissions, callback) {
    var membership = {userid: id, roleid: roleid}

    //You need membership so the user gets access to everything in that role and is associated with that role
    AccessService.assignMembership(membership, function(err, obj) {

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
    })
}

function removeUserFromRole(id, roleid, permissions, callback) {
    var membership = {userid: id, roleid: roleid}

    AccessService.revokeMembership(membership, function(err, obj) {

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
    })
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

