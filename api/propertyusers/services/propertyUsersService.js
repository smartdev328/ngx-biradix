'use strict';
var async = require("async");
var _ = require("lodash")
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../../access/services/accessService')

module.exports = {
    getUserAssignedProperties : function(operator, userid, callback) {

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
}