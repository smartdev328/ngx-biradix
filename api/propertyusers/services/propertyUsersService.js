'use strict';
var async = require("async");
var _ = require("lodash")
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../../access/services/accessService')

module.exports = {
    setPropertiesForUser : function(operator, userid, ids, callback) {
        getUserAssignedProperties(operator, userid, function(err, propertyids) {
            var removed = _.difference(propertyids, ids);
            var added = _.difference(ids, propertyids);

             async.eachLimit(added, 10, function(propertyid, callbackp){
                AccessService.createPermission({executorid: userid, resource: propertyid, allow: true, type: 'PropertyManage'}, function (err, perm) {
                    callbackp(err, perm)
                });
            }, function(err) {
                 async.eachLimit(removed, 10, function(propertyid, callbackp){
                     AccessService.deletePermission({executorid: userid, resource: propertyid, type: 'PropertyManage'}, function (err, perm) {
                         callbackp(err, perm)
                     });
                 }, function(err) {
                     callback();
                 });
            });

        })

    },
    getUserAssignedProperties : function(operator, userid, callback) {
        getUserAssignedProperties(operator, userid, callback)
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