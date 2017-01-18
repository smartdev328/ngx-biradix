'use strict';
var async = require("async");
var _ = require("lodash")
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../../properties/services/propertyService')
var UserService = require('../../users/services/userService')
var AuditService = require('../../audit/services/auditService')
var moment = require("moment-timezone");
var CompService = require('../../properties/services/compsService')

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

                UserService.search(operator,{select:"_id first last email bounceReason active settings.reminders settings.tz",ids:userids}, function(err, users) {

                    users.forEach(function(u) {
                        u.settings = u.settings || {};
                        u.settings.tz = u.settings.tz || 'America/Los_Angeles';
                    })
                    properties.forEach(function(p) {
                        p.users = [];
                        //join full user on ids
                        p.userids.forEach(function(u) {
                            p.users.push(_.find(users, function(x) {return x._id.toString() == u.toString()}));
                        })

                        //remove bounced or reminders off users
                        _.remove(p.users, function(x) {return x.active === false || x.bounceReason || (x.settings && x.settings.reminders && x.settings.reminders.on === false)});
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

                            //Sort by subject first, then alpahabetically
                            propertyusers.forEach(function(p) {
                                p.comps = _.sortBy(p.comps, function (n) {

                                    if (n._id.toString() == p._id.toString()) {
                                        return "-1";
                                    }
                                    return n.name;
                                })
                            })


                            final.push({user: _.find(users, function(x) {return x._id.toString() == userid.toString()}), properties: propertyusers});

                        });

                        final.forEach(function(f) {
                            f.logo ='https://' + f.user.roles[0].org.subdomain + ".biradix.com/images/organizations/" + f.user.roles[0].org.logoBig;
                            f.unsub ='https://' + f.user.roles[0].org.subdomain + ".biradix.com/u";
                            f.dashboardBase ='https://' + f.user.roles[0].org.subdomain + ".biradix.com/d/";

                            //Fix last survey date to users timezone
                            f.properties.forEach(function(p) {
                                p.users = null;
                                delete p.users;
                                delete p._id;
                                delete p.name;
                                delete p.date;
                                delete p.occupancy;
                                delete p.ner;
                                delete p.totalUnits;

                                p.comps.forEach(function(c) {
                                    if (!c.date) {
                                        c.dateUser = "Never";
                                    } else {
                                        c.dateUser = moment(c.date).tz(f.user.settings.tz).format("M/DD")

                                    }

                                    if (typeof c.ner == 'undefined') {
                                        c.nerUser = "";
                                    } else {
                                        c.nerUser = "$" + c.ner.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                    }

                                    if (typeof c.occupancy == 'undefined') {
                                        c.occupancyUser = "";
                                    } else {
                                        c.occupancyUser = c.occupancy + "%";
                                    }

                                })

                                f.user.roles = null;
                                delete f.user.roles;
                                delete f.user.active;


                            });
                        })

                        callback(final)

                        final = null;


                    });

                });

            })

        })
    },
    updateGuestPermissionsForProperty : function(propertyid,callback) {
        updateGuestPermissionsForProperty(propertyid,callback);

    },
    setUsersForProperty : function(operator,context,revertedFromId, propertyid, ids, callback) {
        var _this = this;
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
    setPropertiesForUser : function(operator,context,revertedFromId, userid, ids, rolesChanged, callback) {
        async.parallel({
            differences: function(callbackp) {
                getUserAssignedProperties(operator, userid, function(err, propertyids) {
                    //remove all and re-add all properties when updating a user to make sure all permissions get created when roles changed
                    var removed = propertyids;//_.difference(propertyids, ids);
                    var added = ids;//_.difference(ids, propertyids);

                    if (!rolesChanged) {
                        removed = _.difference(propertyids, ids);
                        added = _.difference(ids, propertyids);
                    }
                    callbackp(null, {added: added, removed: removed})
                })
            }
        }, function(err, all) {
            async.eachLimit(all.differences.removed, 10, function(propertyid, callbackp){
                unLinkPropertyFromUser(operator,context,revertedFromId,userid, propertyid, callbackp)

            }, function(err) {
                async.eachLimit(all.differences.added, 10, function(propertyid, callbackp){
                    LinkPropertyWithUser(operator,context,revertedFromId,userid, propertyid, callbackp)
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
        getPropertyAssignedUsers(operator, propertyid, ['RM','BM','PO','Guest'], callback)
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
    },
}

var updateGuestPermissionsForSubject = function(guestid, subjectid, callback) {

    async.parallel([
            function (callbackp) {
                //Add view permission for subject
                AccessService.createPermission({executorid: guestid,resource: subjectid,allow: true,type: 'PropertyView',direct: true}, function () {
                    callbackp();
                });
            },
            function (callbackp) {
                //Give inherited access to RMs and BMs of subjects to manage these users
                AccessService.getRoles({tags:[subjectid]}, function(err, roles) {
                    var RMRole = _.find(roles, function(x) {return x.tags.indexOf('RM_GROUP') > -1});
                    var BMRole = _.find(roles, function(x) {return x.tags.indexOf('BM_GROUP') > -1});

                    AccessService.createPermission({executorid: RMRole._id ,resource: guestid,allow: true,type: 'UserManage'}, function () {
                        AccessService.createPermission({executorid: BMRole._id ,resource: guestid,allow: true,type: 'UserManage'}, function () {
                            callbackp();
                        });
                    });

                });

            },
            function (callbackp) {
                //Get all CMs of subject org and give that role inherit permissions to manage these users
                UserService.getSystemUser(function(System) {
                    var SystemUser = System.user;
                    PropertyService.search(SystemUser, {ids:[subjectid], select: "name orgid"}, function(err, props) {
                        if (props[0].orgid) {
                            AccessService.getRoles({orgid:props[0].orgid, tags: ['CM'] }, function(err, roles) {
                                AccessService.createPermission({executorid: roles[0]._id ,resource: guestid,allow: true,type: 'UserManage'}, function () {
                                    callbackp();
                                });

                            });
                        } else {
                            callbackp();
                        }
                    })
                });
            }

        ],
        function () {
            callback();
        }
    )






}
var uppdateGuestPermissions = function(guestid, callback) {
    UserService.getSystemUser(function(System) {
        var SystemUser = System.user;
        //Get all comps the guest belongs to
       getUserAssignedProperties(SystemUser,guestid,function(err,properties) {

           console.log(guestid);
           //Delete All User Manage Roles for resource guestid
           AccessService.deletePermission({resource: guestid, type: 'UserManage'}, function(err) {
               console.log(err);
               //Remove All View Permissions from guest
               AccessService.deletePermissionsByExecutorAndType({
                   executorid: guestid,
                   type: 'PropertyView'
               }, function (err) {
                   console.log(err);
                   //Get all subjects all the comps belong to and update permissions for each
                   CompService.getSubjects(properties, {select: "_id"}, function (err, subjects) {
                       async.eachLimit(subjects, 10, function (subject, callbackp) {
                           updateGuestPermissionsForSubject(guestid, subject._id.toString(), callbackp);

                       }, function (err) {

                           //Add All View Permissions from guest to their comps
                           async.eachLimit(properties, 10, function (propertyid, callbackp) {
                               AccessService.createPermission({
                                   executorid: guestid,
                                   resource: propertyid,
                                   allow: true,
                                   type: 'PropertyView',
                                   direct: true
                               }, function () {
                                   callbackp();
                               });

                           }, function (err) {
                                callback();
                           });
                       });
                   })
               })
           });


       })
    });
}

var updateGuestPermissionsForProperty = function(propertyid, callback) {
    UserService.getSystemUser(function(System) {
        var SystemUser = System.user;

        //Get all Guests
        getPropertyAssignedUsers(SystemUser, propertyid, ['Guest'], function(err, users) {
            async.eachLimit(users, 10, function(guest, callbackp){
                uppdateGuestPermissions(guest, callbackp);
            }, function(err) {
                callback();
            });
        })

    });
}
var unLinkPropertyFromUser = function(operator,context,revertedFromId,userid, propertyid, callback) {
    // console.log('Unlink:', userid, propertyid);
    UserService.search(operator,{select:"_id first last",ids:[userid.toString()]}, function(err, users) {
        var user = users[0];
        async.parallel({
            users: function (callbackp) {
                UserService.search(operator, {select: "_id first last", ids: [userid.toString()]}, callbackp);
            },
            roles: function (callbackp) {
                AccessService.getRoles({tags: [propertyid.toString()]}, callbackp);
            },
            properties: function (callbackp) {
                var permission = 'PropertyManage';

                if (user.roles[0].tags[0] == 'Guest') {
                    permission = 'CompManage';
                }

                PropertyService.search(operator, {select:"_id name comps.id", ids:[propertyid.toString()], permission: permission}, function(err,props,lookups) {
                    callbackp(err,props)
                })
            }
        }, function (err, all) {
            var RMRole = _.find(all.roles, function (x) {
                return x.tags.indexOf('RM_GROUP') > -1
            });
            var BMRole = _.find(all.roles, function (x) {
                return x.tags.indexOf('BM_GROUP') > -1
            });
            var PORole = _.find(all.roles, function (x) {
                return x.tags.indexOf('PO_GROUP') > -1
            });

            var property = all.properties[0];

            async.parallel([
                function(callbackp) {
                    AccessService.deletePermission({
                        executorid: RMRole._id,
                        resource: user._id,
                        type: 'UserManage'
                    }, function () {
                        callbackp(null,1);
                    });
                },
                function(callbackp) {
                    AccessService.deletePermission({
                        executorid: BMRole._id,
                        resource: user._id,
                        type: 'UserManage'
                    }, function () {
                        callbackp(null,2);
                    });
                },
                function(callbackp) {
                    AccessService.deletePermission({
                        executorid: PORole._id,
                        resource: user._id,
                        type: 'UserManage'
                    }, function () {
                        callbackp(null,3);
                    });
                },
                function(callbackp) {
                    AccessService.revokeMembership({userid: user._id, roleid: RMRole._id}, function () {
                        callbackp(null,4);
                    });
                },
                function(callbackp) {
                    AccessService.revokeMembership({userid: user._id, roleid: BMRole._id}, function () {
                        callbackp(null,5);
                    });
                },
                function(callbackp) {
                    AccessService.revokeMembership({userid: user._id, roleid: PORole._id}, function () {
                        callbackp(null,6);
                    });
                },
                function(callbackp) {
                    AccessService.deletePermission({
                        executorid: userid,
                        resource: propertyid,
                        type: 'PropertyManage'
                    }, function () {
                        callbackp(null,7);
                    });
                },
            ], function(err,done) {
                console.log(done);

                AuditService.create({
                    operator: operator,
                    property: property,
                    user: user,
                    type: 'user_unassigned',
                    revertedFromId: revertedFromId,
                    description: user.first + ' ' + user.last + ' <= ~ => ' + property.name,
                    context: context,
                    data: [{propertyid: propertyid, userid: userid}]
                })

                //Re-calculate all guest permissions related if this is a guest

                if (user.roles[0].tags[0] == 'Guest') {
                    uppdateGuestPermissions(userid, function() {
                        UserService.removeGuestStats(userid, propertyid, function() {
                            callback(null)
                        })
                    });
                } else {
                    callback(null)
                }

            })






        });
    });
}

var LinkPropertyWithUser = function(operator,context,revertedFromId, userid, propertyid, callback) {
    // console.log('Link:', userid, propertyid);
    UserService.search(operator,{select:"_id first last",ids:[userid.toString()]}, function(err, users) {
        var user = users[0];
        async.parallel({
            roles: function(callbackp) {
                AccessService.getRoles({tags:[propertyid.toString()]}, callbackp);
            },
            properties: function(callbackp) {
                var permission = 'PropertyManage';

                if (user.roles[0].tags[0] == 'Guest') {
                    permission = 'CompManage';
                }

                PropertyService.search(operator, {select:"_id name comps.id", ids:[propertyid.toString()], permission: permission}, function(err,props,lookups) {
                    callbackp(err,props)
                })
            }
        }, function(err, all) {

            var RMRole = _.find(all.roles, function(x) {return x.tags.indexOf('RM_GROUP') > -1});
            var BMRole = _.find(all.roles, function(x) {return x.tags.indexOf('BM_GROUP') > -1});
            var PORole = _.find(all.roles, function(x) {return x.tags.indexOf('PO_GROUP') > -1});


            var property = all.properties[0];

            if (user.roles[0].tags[0]=="RM") {
                AccessService.createPermission({executorid: RMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
                AccessService.assignMembership({userid: user._id, roleid: RMRole._id}, function () {});
            }
            else
            if (user.roles[0].tags[0]=="BM") {
                AccessService.createPermission({executorid: RMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
                AccessService.createPermission({executorid: BMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
                AccessService.assignMembership({userid: user._id, roleid: BMRole._id}, function () {});
            }
            else
            if (user.roles[0].tags[0]=="PO") {
                AccessService.createPermission({executorid: RMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
                AccessService.createPermission({executorid: BMRole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
                AccessService.createPermission({executorid: PORole._id ,resource: user._id,allow: true,type: 'UserManage'}, function () {});
                AccessService.assignMembership({userid: user._id, roleid: PORole._id}, function () {});
            }

            AccessService.createPermission({executorid: userid,resource: propertyid,allow: true,type: 'PropertyView',direct: true}, function () {});

            AuditService.create({operator: operator, property: property, user: user, type: 'user_assigned', revertedFromId : revertedFromId, description: user.first + ' ' + user.last + ' <= + => ' + property.name, context: context, data : [{propertyid: propertyid, userid: userid}]})


            AccessService.createPermission({executorid: userid,resource: propertyid,allow: true,type: 'PropertyManage',direct: true}, function () {
                if (user.roles[0].tags[0] == 'Guest') {
                    //Re-calculate all guest permissions related if this is a comp
                    uppdateGuestPermissions(userid, function() {
                        UserService.updateGuestStatsDateAdded(userid, propertyid, function() {
                            callback(null)
                        })

                    })
                } else {
                    callback(null)
                }
            });

        });
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
                callbackp(err, _.uniq(propertyids))

            })
        },
        //all proeprties the operator can manage
        operatorAllowed : function(callbackp) {
            AccessService.getPermissions(operator,['PropertyManage','CompManage'],function(resourceids) {

                callbackp(null,_.uniq(resourceids))

            })
        }
    },function(err, all) {
        if (err) {
            return callback([{msg:"Unable to retrieve properties."}], null)
        }

        if (operator.memberships && operator.memberships.isadmin) {
            return callback(null,all.userAssigned)
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