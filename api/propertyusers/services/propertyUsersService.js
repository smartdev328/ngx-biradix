'use strict';
var async = require("async");
var _ = require("lodash")
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../../properties/services/propertyService')
var UserService = require('../../users/services/userService')
var AuditService = require('../../audit/services/auditService')

module.exports = {
    getPropertiesForReminders: function(operator, callback) {
        PropertyService.getPropertiesForReminders(function(properties) {

            async.eachLimit(properties,20, function(property, callbackp) {
                getPropertyAssignedUsers(operator, property._id, ['RM','BM'], function(err, userids) {
                    property.userids = userids;
                    callbackp();
                });
            }, function(err) {
                //Remove all properties without users assigned to them
                _.remove(properties, function(x) {return !x.userids || !x.userids.length})

                //Get all userids
                var userids = [];
                properties.forEach(function(p) {
                    userids = userids.concat(p.userids);
                })

                UserService.search(operator,{select:"_id first last email bounceReason settings.reminders",ids:userids}, function(err, users) {
                    properties.forEach(function(p) {
                        p.users = [];
                        //join full user on ids
                        p.userids.forEach(function(u) {
                            p.users.push(_.find(users, function(x) {return x._id.toString() == u.toString()}));
                        })

                        //remove bounced or reminders off users
                        _.remove(p.users, function(x) {return x.bounceReason || (x.settings && x.settings.reminders && x.settings.reminders.on === false)});
                        delete p.userids;
                    })

                    //Remove all properties without users assigned to them (again)
                    _.remove(properties, function(x) {return !x.users || !x.users.length})

                    //Get all compids
                    var compids = [];
                    properties.forEach(function(p) {
                        compids = compids.concat(p.compids);
                    })


                    PropertyService.getCompsForReminders(compids,function(comps) {
                        properties.forEach(function(p) {
                            p.comps = [];
                            //join full comp on ids
                            p.compids.forEach(function(u) {
                                p.comps.push(_.find(comps, function(x) {return x._id.toString() == u.toString()}));
                            })

                            delete p.compids;
                        })

                        var final = [];

                        //Get final unique list of good userids so we can build their properties
                        var finaluserids = [];
                        properties.forEach(function(p) {
                            finaluserids = finaluserids.concat(_.map(p.users,"_id"));
                        })

                        finaluserids = _.uniq(finaluserids);

                        //for each unique users, get all the properties they are assigned to
                        finaluserids.forEach(function(userid) {
                            var propertyusers = _.filter(properties, function(p) { return _.find(p.users, function(pu) { return pu._id.toString() == userid})});
                            final.push({user: _.find(users, function(x) {return x._id.toString() == userid.toString()}), properties: propertyusers});

                        });

                        //Todo: put together email for each user
                        callback(final)
                    });

                });

            })

        })
    },
    setUsersForProperty : function(operator,context,revertedFromId, propertyid, ids, callback) {

        async.parallel({
            differences: function(callbackp) {
                getPropertyAssignedUsers(operator, propertyid,['RM','BM','PO'], function(err, userids) {
                    var removed = _.difference(userids, ids);
                    var added = _.difference(ids, userids);
                    callbackp(null, {added: added, removed: removed})
                })
            }
        }, function(err, all) {

            async.eachLimit(all.differences.added, 10, function(userid, callbackp){
                LinkPropertyWithUser(operator,context,revertedFromId, userid, propertyid, callbackp)
            }, function(err) {
                async.eachLimit(all.differences.removed, 10, function(userid, callbackp){
                    unLinkPropertyFromUser(operator,context,revertedFromId,userid, propertyid, callbackp)
                }, function(err) {
                    callback();
                });
            });
        });
    },
    setPropertiesForUser : function(operator,context,revertedFromId, userid, ids, callback) {

        async.parallel({
            differences: function(callbackp) {
                getUserAssignedProperties(operator, userid, function(err, propertyids) {
                    var removed = _.difference(propertyids, ids);
                    var added = _.difference(ids, propertyids);
                    callbackp(null, {added: added, removed: removed})
                })
            }
        }, function(err, all) {

            async.eachLimit(all.differences.added, 10, function(propertyid, callbackp){
                LinkPropertyWithUser(operator,context,revertedFromId,userid, propertyid, callbackp)
            }, function(err) {
                async.eachLimit(all.differences.removed, 10, function(propertyid, callbackp){
                    unLinkPropertyFromUser(operator,context,revertedFromId,userid, propertyid, callbackp)
                }, function(err) {
                    callback();
                });
            });
        });
    },
    getUserAssignedProperties : function(operator, userid, callback) {
        getUserAssignedProperties(operator, userid, callback)
    },

    getPropertyAssignedUsers : function(operator, propertyid, callback) {
        getPropertyAssignedUsers(operator, propertyid, ['RM','BM','PO'], callback)
    },

    unlink : function(operator,context,revertedFromId,userid,propertyid,callback) {
        async.parallel({
            properties: function(callbackp) {
                getUserAssignedProperties(operator, userid, callbackp)
            }  ,
        }, function(err, all) {
            if (all.properties.indexOf(propertyid.toString()) > -1) {
                unLinkPropertyFromUser(operator,context,revertedFromId,userid, propertyid, callback)
            } else {
                callback([{msg:"Property and User are not longer assigned to each other"}]);
            }
        });
    },

    link : function(operator,context,revertedFromId,userid,propertyid,callback) {
        async.parallel({
            properties: function(callbackp) {
                getUserAssignedProperties(operator, userid, callbackp)
            }  ,
        }, function(err, all) {
            if (all.properties.indexOf(propertyid.toString()) == -1) {
                LinkPropertyWithUser(operator,context,revertedFromId,userid, propertyid, callback)
            } else {
                callback([{msg:"Property and User are are already assigned to each other"}]);
            }
        });
    }

}
var unLinkPropertyFromUser = function(operator,context,revertedFromId,userid, propertyid, callback) {
    async.parallel({
        users: function(callbackp) {
            UserService.search(operator,{select:"_id first last",ids:[userid.toString()]}, callbackp);
        }  ,
        roles: function(callbackp) {
            AccessService.getRoles({tags:[propertyid.toString()]}, callbackp);
        },
        properties: function(callbackp) {
            PropertyService.search(operator, {select:"_id name", ids:[propertyid.toString()]}, function(err,props,lookups) {
                callbackp(err,props)
            })
        }
    }, function(err, all) {
        var RMRole = _.find(all.roles, function(x) {return x.tags.indexOf('RM_GROUP') > -1});
        var BMRole = _.find(all.roles, function(x) {return x.tags.indexOf('BM_GROUP') > -1});
        var PORole = _.find(all.roles, function(x) {return x.tags.indexOf('PO_GROUP') > -1});

        var user = all.users[0];
        var property = all.properties[0];

        AccessService.deletePermission({executorid: RMRole._id , resource: user._id, type: 'UserManage'}, function () {});
        AccessService.deletePermission({executorid: BMRole._id , resource: user._id, type: 'UserManage'}, function () {});
        AccessService.deletePermission({executorid: PORole._id , resource: user._id, type: 'UserManage'}, function () {});

        AccessService.revokeMembership({userid: user._id, roleid: RMRole._id}, function () {});
        AccessService.revokeMembership({userid: user._id, roleid: BMRole._id}, function () {});
        AccessService.revokeMembership({userid: user._id, roleid: PORole._id}, function () {});

        AccessService.deletePermission({executorid: userid, resource: propertyid, type: 'PropertyManage'}, function () {});

        AuditService.create({operator: operator, property: property, user: user, type: 'user_unassigned', revertedFromId : revertedFromId, description: user.first + ' ' + user.last + ' <= ~ => ' + property.name, context: context, data : [{propertyid: propertyid, userid: userid}]})

        callback(null)
    });
}

var LinkPropertyWithUser = function(operator,context,revertedFromId, userid, propertyid, callback) {
    async.parallel({
        users: function(callbackp) {
            UserService.search(operator,{select:"_id first last",ids:[userid.toString()]}, callbackp);
        }  ,
        roles: function(callbackp) {
            AccessService.getRoles({tags:[propertyid.toString()]}, callbackp);
        },
        properties: function(callbackp) {
            PropertyService.search(operator, {select:"_id name comps.id", ids:[propertyid.toString()]}, function(err,props,lookups) {
                callbackp(err,props)
            })
        }
    }, function(err, all) {
        var RMRole = _.find(all.roles, function(x) {return x.tags.indexOf('RM_GROUP') > -1});
        var BMRole = _.find(all.roles, function(x) {return x.tags.indexOf('BM_GROUP') > -1});
        var PORole = _.find(all.roles, function(x) {return x.tags.indexOf('PO_GROUP') > -1});

        var user = all.users[0];
        var property = all.properties[0];

        if (user.roleType=="RM") {
            AccessService.createPermission({executorid: RMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
            AccessService.assignMembership({userid: user._id, roleid: RMRole._id}, function () {});
        }
        else
        if (user.roleType=="BM") {
            AccessService.createPermission({executorid: RMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
            AccessService.createPermission({executorid: BMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
            AccessService.assignMembership({userid: user._id, roleid: BMRole._id}, function () {});
        }
        else
        if (user.roleType=="PO") {
            AccessService.createPermission({executorid: RMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
            AccessService.createPermission({executorid: BMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
            AccessService.createPermission({executorid: PORole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
            AccessService.assignMembership({userid: user._id, roleid: PORole._id}, function () {});

            //all.properties.forEach(function(property) {
            //    property.comps.forEach(function(comp) {
            //        AccessService.createPermission({
            //            executorid: PORole._id,
            //            resource: comp.id,
            //            allow: true,
            //            type: 'PropertyView'
            //        }, function () {
            //        });
            //    })
            //})
        }
        AccessService.createPermission({executorid: userid,resource: propertyid,allow: true,type: 'PropertyManage',direct: true}, function () {});

        AuditService.create({operator: operator, property: property, user: user, type: 'user_assigned', revertedFromId : revertedFromId, description: user.first + ' ' + user.last + ' <= + => ' + property.name, context: context, data : [{propertyid: propertyid, userid: userid}]})

        callback(null)
    });
}

var getUserAssignedProperties = function(operator, userid, callback) {

    async.parallel({
        //user assigned direct proprties
        userAssigned  : function(callbackp) {
            AccessService.searchPermissions({types:['PropertyManage'], executorid : userid},function(err, obj) {

                var propertyids;

                if (obj && !err) {
                    propertyids = _.pluck(obj, "resource").map(function (x) {
                        return x.toString()
                    })
                }
                callbackp(err, propertyids)

            })
        },
        //all proeprties the operator can manage
        operatorAllowed : function(callbackp) {
            AccessService.getPermissions(operator,['PropertyManage'],function(resourceids) {

                callbackp(null,resourceids)

            })
        }
    },function(err, all) {

        if (err) {
            return callback([{msg:"Unable to retrieve properties."}], null)
        }

        //make sure to return only properties of the user that the operator has access to:
        callback(null, _.intersection(all.userAssigned, all.operatorAllowed))

    })

}

var getPropertyAssignedUsers = function(operator, propertyid, roleTypes, callback) {

    //Get Orgid of property first
    PropertyService.search(operator, {ids:[propertyid]}, function(err, props) {
        async.parallel({
            //user assigned direct proprties
            userAssigned  : function(callbackp) {
                AccessService.searchPermissions({types:['PropertyManage'], resource : propertyid, direct: true},function(err, obj) {

                    var userids;

                    if (obj && !err) {
                        userids = _.pluck(obj, "executorid").map(function (x) {
                            return x.toString()
                        })
                    }
                    callbackp(err, userids)

                })
            },
            //all proeprties the operator can manage
            operatorAllowed : function(callbackp) {

                UserService.search(operator, {active:true, roleTypes:roleTypes, orgid: props[0].orgid}, function(err, obj) {
                    var userids;

                    if (obj && !err) {
                        userids = _.pluck(obj, "_id").map(function (x) {
                            return x.toString()
                        })
                    }
                    callbackp(err, userids)
                })
            }
        },function(err, all) {

            if (err) {
                return callback([{msg:"Unable to retrieve users."}], null)
            }

            //make sure to return only properties of the user that the operator has access to:
            callback(null, _.intersection(all.userAssigned, all.operatorAllowed))

        })
    })


}