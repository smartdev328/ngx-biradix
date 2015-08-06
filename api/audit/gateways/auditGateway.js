'use strict';

var express = require('express');
var AuditService = require('../services/auditService')
var AccessService = require('../../access/services/accessService')
var UserService = require('../../users/services/userService')
var PropertyService = require('../../properties/services/propertyService')
var Routes = express.Router();
var async = require('async')
var _ = require('lodash')

Routes.get('/filters', function (req, res) {
    async.parallel({
        users: function(callbackp) {
                UserService.search(req.user, {}, function(err,users) {
                    callbackp(null, users)
                })
        },

        properties: function(callbackp) {
            PropertyService.search(req.user, {permission: 'PropertyManage', select: '_id name comps.id', limit: 1000}, function(err,properties) {

                if (req.user.memberships.isadmin === true) {
                    callbackp(null, properties)
                } else {
                    var subjectandcompids = _.pluck(_.flatten(_.pluck(properties,'comps')),"id").concat(_.pluck(properties, "_id"));
                    PropertyService.search(req.user, {permission: 'PropertyView', select: '_id name', ids: subjectandcompids, limit: 1000}, function(err,properties) {
                        callbackp(null, properties)
                    });
                }
            })
        },

    }, function(err, all) {
            return res.status(200).json({audits: AuditService.audits, users: all.users, properties: all.properties});
    })

});

Routes.post('/undo', function (req, res) {
    AccessService.canAccess(req.user,"History", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        search(req, function(err, obj) {
            if (err || !obj || obj.length != 1) {
                return res.status(400).json("Invalid parameters");
            }

            var o = obj[0];

            //TODO: error if no changes
            var errors = [];
            async.waterfall([
                function(callbacks){
                    switch (o.type) {
                        case "user_status":
                            UserService.updateActive(req.user, {id: o.user.id, active: o.data[0].status ? true : false }, req.context, o._id, function (err,n) {
                                errors = err || [];
                                callbacks(null)
                            });
                            break;
                        case "property_status":
                            PropertyService.updateActive(req.user, {id: o.property.id, active: o.data[0].status ? true : false }, req.context, o._id, function (err, n) {
                                errors = err || [];
                                callbacks(null)
                            });
                            break;
                        case "comp_unlinked":
                            PropertyService.linkComp(req.user, req.context, o._id, o.data[0].id, o.data[1].id,  function (err, n) {
                                errors = err || [];
                                callbacks(null)
                            });
                            break;
                        case "comp_linked":
                            PropertyService.unlinkComp(req.user, req.context, o._id, o.data[0].id, o.data[1].id,  function (err, n) {
                                errors = err || [];
                                callbacks(null)
                            });
                            break;
                        case "links_updated":
                            linksUpdated(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        default:
                            errors = [{msg:"Unable to undo this action"}];
                            callbacks(null);
                    }
                }, function(callbacks) {
                    if (errors.length > 0) {
                        callbacks(null);
                    } else {
                        AuditService.updateReverted(o._id, function() {
                            callbacks(null);
                        })
                    }
                }
            ], function() {
                return res.status(200).json({errors:errors});
            });
        });
    });
});

Routes.post('/', function (req, res) {
    AccessService.canAccess(req.user,"History", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }


        search(req, function(err, obj, pager) {
                if (err) {
                    return res.status(200).json({errors: err});
                }

                return res.status(200).json({errors: null, activity: obj, pager: pager});
            });
    })
});

Routes.put('/', function (req, res) {
    var audit = req.body;
    audit.operator = req.user;
    audit.context = req.context;
    AuditService.create(audit, function() {
        return res.status(200).json({success:true});
    })

});

module.exports = Routes;

function search(req, callback) {
    async.parallel({
        userids: function(callbackp) {
            if (req.user.memberships.isadmin === true) {
                callbackp(null,[]);
            } else {
                UserService.search(req.user, {}, function(err,users) {
                    callbackp(null, _.pluck(users,"_id"))
                });
            }
        },
    }, function(err, all) {
        AuditService.get(req.body,all.userids, function (err, obj, pager) {
            callback(err, obj, pager)
        });
    })
}

function linksUpdated(req, o, callback) {
    var subjectid = o.data[0].id;
    var compid = o.data[1].id;

    var added = _.pluck(_.filter(o.data, function(x) {return x.type && x.type == 'added'}),"id");
    var removed = _.pluck(_.filter(o.data, function(x) {return x.type && x.type == 'removed'}),"id");
    PropertyService.search(req.user,{_id: subjectid, select: 'comps'}, function(er, props) {
        var comp = _.find(props[0].comps, function(x) {
            return x.id == compid}).floorplans;
        //console.log(comp, added, removed);
        if (added && added.length > 0) {
            _.remove(comp, function(x) {return added.indexOf(x.toString()) > -1})
        }
        if (removed && removed.length > 0) {
            comp = _.uniq(comp.concat(removed));
        }

        PropertyService.saveCompLink(req.user,req.context, o._id,subjectid,compid,comp,callback);

    })
}