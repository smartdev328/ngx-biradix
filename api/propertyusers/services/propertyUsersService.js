'use strict';
var async = require("async");
var _ = require("lodash")
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../../properties/services/propertyService')
var UserService = require('../../users/services/userService')


module.exports = {
    setUsersForProperty : function(operator, propertyid, ids, callback) {

        async.parallel({
            differences: function(callbackp) {
                getPropertyAssignedUsers(operator, propertyid, function(err, userids) {
                    var removed = _.difference(userids, ids);
                    var added = _.difference(ids, userids);
                    callbackp(null, {added: added, removed: removed})
                })
            }
        }, function(err, all) {

            async.eachLimit(all.differences.added, 10, function(userid, callbackp){
                AccessService.createPermission({executorid: userid, resource: propertyid, allow: true, type: 'PropertyManage', direct: true}, function (err, perm) {
                    callbackp(err, perm)
                });
            }, function(err) {
                async.eachLimit(all.differences.removed, 10, function(userid, callbackp){
                    AccessService.deletePermission({executorid: userid, resource: propertyid, type: 'PropertyManage'}, function (err, perm) {
                        callbackp(err, perm)
                    });
                }, function(err) {
                    callback();
                });
            });
        });
    },
    setPropertiesForUser : function(operator, userid, ids, callback) {

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
                AccessService.createPermission({executorid: userid, resource: propertyid, allow: true, type: 'PropertyManage', direct: true}, function (err, perm) {
                    callbackp(err, perm)
                });
            }, function(err) {
                async.eachLimit(all.differences.removed, 10, function(propertyid, callbackp){
                    AccessService.deletePermission({executorid: userid, resource: propertyid, type: 'PropertyManage'}, function (err, perm) {
                        callbackp(err, perm)
                    });
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
        getPropertyAssignedUsers(operator, propertyid, callback)
    }

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

var getPropertyAssignedUsers = function(operator, propertyid, callback) {

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

                UserService.search(operator, {active:true, roleTypes:['RM','BM','PO'], orgid: props[0].orgid}, function(err, obj) {
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