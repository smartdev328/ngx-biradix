'use strict';

var express = require('express');
var AuditService = require('../services/auditService')
var AccessService = require('../../access/services/accessService')
var PropertyHelperService = require('../../properties/services/propertyHelperService')
var PropertyService = require('../../properties/services/propertyService')
var CreateService = require('../../properties/services/createService')
var AmenitiesService = require('../../amenities/services/amenityService')
var UserService = require('../../users/services/userService')
var UserCreateService = require('../../users/services/userCreateService')
var PropertyUserService = require('../../propertyusers/services/propertyUsersService')
var PropertyAmenityService = require('../../propertyamenities/services/propertyAmenityService')
var Routes = express.Router();
var async = require('async')
var _ = require('lodash')

Routes.get('/filters', function (req, res) {
    async.parallel({
        users: function(callbackp) {
                UserService.search(req.user, {}, callbackp)
        },

        properties: function(callbackp) {
            getPropertiesAndComps(req, function(err,props,comps) {
                callbackp(null, {subject:props,comps:comps})
            });
        },
        audits: function(callbackp) {
            var audits = AuditService.audits;

            if (req.user.memberships.isadmin !== true) {
                _.remove(audits, function(x) {return x.admin === true})
            }

            callbackp(null,audits)
        }

    }, function(err, all) {
        res.status(200).json({audits: all.audits, users: all.users, properties: all.properties.subject.concat(all.properties.comps)});
        all = null;
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
                        case "survey_created":
                            PropertyService.deleteSurvey(req.user, req.context, o._id, o.data[0].id,  function (err, n) {
                                errors = err || [];
                                callbacks(null)
                            });
                            break;
                        case "survey_deleted":
                            PropertyService.createSurvey(req.user, req.context, o._id, o.data[0].survey.propertyid, o.data[0].survey,  function (err, n) {
                                errors = err || [];
                                callbacks(null)
                            });
                            break;
                        case "survey_updated":
                            PropertyService.updateSurvey(req.user, req.context, o._id, o.data[0].survey.propertyid, o.data[0].survey._id, o.data[0].survey,  function (err, n) {
                                errors = err || [];
                                callbacks(null)
                            });
                            break;
                        case "property_profile_updated":
                        case "property_contact_updated":
                            propertyUpdateUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "property_fees_updated":
                            propertyFeesUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "property_amenities_updated":
                            propertyAmenitiesUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "property_floorplan_created":
                            propertyFloorplanCreatedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "property_floorplan_removed":
                            propertyFloorplanRemovedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "property_floorplan_updated":
                            propertyFloorplanUpdatedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "property_floorplan_amenities_updated":
                            propertyFloorplanAmenitiesUpdatedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "user_updated":
                            userUpdatedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "user_assigned":
                            userAssignedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "user_unassigned":
                            userUnAssignedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "amenity_deleted":
                            amenityDeletedUndo(req,o, function(err) {
                                errors = err || [];
                                callbacks(null)
                            })
                            break;
                        case "amenity_undeleted":
                            amenityUnDeletedUndo(req,o, function(err) {
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
                    res.status(200).json({errors: err});
                }
                else {
                    var propertyids = _.pluck(obj,"property.id");
                    _.remove(propertyids, function(x) {return !x});
                    propertyids = propertyids.map(function(x) {return x.toString()});
                    propertyids = _.uniq(propertyids);

                    obj = JSON.parse(JSON.stringify(obj));
                    PropertyService.search(req.user, {limit: 1000, permission: ['PropertyManage'], ids: propertyids
                        , select: "_id"
                    }, function(err, properties) {
                        obj.forEach(function(o) {
                            o.canUndo = true;
                            if (o.property && o.property.orgid && !_.find(properties, function(x) {return x._id.toString() == o.property.id.toString()})) {
                                o.canUndo = false;
                            }
                        })
                        res.status(200).json({errors: null, activity: obj, pager: pager});
                        obj = null;
                    })
                }
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
        propertyids: function(callbackp) {
            if (req.user.memberships.isadmin === true) {
                callbackp(null,{subject:[],comps:[]});
            } else {
                getPropertiesAndComps(req, function(err,props,comps) {
                    callbackp(null, {subject:_.pluck(props,"_id"),comps:_.pluck(comps,"_id")})
                });
            }
        },
    }, function(err, all) {
        AuditService.get(req.body,all.userids,all.propertyids.subject,all.propertyids.comps, function (err, obj, pager) {
            callback(err, obj, pager)
            all = null;
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
            return x.id == compid});

        if (!comp) {
            callback([{msg: 'These 2 properties are no longer comps. Their floor plans comp links can no longer be updated'}]);
            return;
        }

        comp = comp.floorplans;

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

function propertyUpdateUndo(req, o, callback) {
    AmenitiesService.search({}, function(err, amenities) {
        PropertyService.search(req.user, {_id: o.property.id, select: "*", permission: ['CompManage','PropertyManage']}, function (er, props) {
            var property = props[0];
            o.data.forEach(function (d) {
                property[d.field] = d.old_value;
            })

            PropertyHelperService.fixAmenities(property,amenities);
            // console.log(property);
            // callback([{msg: 'test'}]);
            // return;

            CreateService.update(req.user, req.context, o._id, property, callback);
        });
    });

}

function amenityDeletedUndo(req, o, callback) {
    PropertyAmenityService.unDeleteAmenity(req.user,req.context, o._id, o.data[0].amenityid, o.data[0].properties,callback);
}

function amenityUnDeletedUndo(req, o, callback) {
    PropertyAmenityService.deleteAmenity(req.user,req.context, o._id, o.data[0].amenityid,callback);
}

function propertyFeesUndo(req, o, callback) {
    AmenitiesService.search({}, function(err, amenities) {
        PropertyService.search(req.user, {_id: o.property.id, select: "*", permission: ['CompManage','PropertyManage']}, function (er, props) {
            var property = props[0];
            o.data.forEach(function (d) {
                property.fees[d.field] = d.old_value;
            })

            PropertyHelperService.fixAmenities(property, amenities);
            // console.log(property);
            // callback([{msg: 'test'}]);
            // return;

            CreateService.update(req.user, req.context, o._id, property, callback);
        });
    });
}

function propertyAmenitiesUndo(req, o, callback) {
    AmenitiesService.search({}, function(err, amenities) {
        PropertyService.search(req.user,{_id: o.property.id, select: "*", permission: ['CompManage','PropertyManage']}, function(er, props) {
            var property = props[0];

            o.data.forEach(function (d) {

                if (d.type == 'added') {
                    _.pull(property[d.amenity_type], d.id);
                } else {
                    property[d.amenity_type].push(d.id);
                }

            })


            property.location_amenities = _.uniq(property.location_amenities);
            property.community_amenities = _.uniq(property.community_amenities);

            PropertyHelperService.fixAmenities(property, amenities);
            // console.log(property);
            // callback([{msg: 'test'}]);
            // return;

            CreateService.update(req.user,req.context, o._id,property,callback);
        });
    })

}

function propertyFloorplanCreatedUndo (req, o, callback) {
    AmenitiesService.search({}, function(err, amenities) {
        PropertyService.search(req.user, {_id: o.property.id, select: "*", permission: ['CompManage','PropertyManage']}, function (er, props) {
            var property = props[0];
            _.remove(property.floorplans, function (fp) {
                return fp.id.toString() == o.data[0].id.toString()
            });

            PropertyHelperService.fixAmenities(property,amenities);

            // console.log(property);
            // callback([{msg: 'test'}]);
            // return;


            CreateService.update(req.user, req.context, o._id, property, callback);
        });
    });
}

function propertyFloorplanRemovedUndo  (req, o, callback) {
    AmenitiesService.search({}, function(err, amenities) {
        PropertyService.search(req.user, {_id: o.property.id, select: "*", permission: ['CompManage','PropertyManage']}, function (er, props) {
            var property = props[0];
            var oldfp = o.data[0].old_value;
            oldfp.new = true;

            property.floorplans.push(oldfp);

            PropertyHelperService.fixAmenities(property,amenities);

            // console.log(property);
            // callback([{msg: 'test'}]);
            // return;

            CreateService.update(req.user,req.context, o._id,property,callback);
        });
    });
}

function propertyFloorplanUpdatedUndo  (req, o, callback) {
    AmenitiesService.search({}, function(err, amenities) {
        PropertyService.search(req.user, {_id: o.property.id, select: "*", permission: ['CompManage','PropertyManage']}, function (er, props) {
            var property = props[0];

            var old = o.data[0].old_value;

            property.floorplans.forEach(function (fp, i) {
                if (fp.id.toString() == old.id.toString()) {
                    property.floorplans[i].bedrooms = old.bedrooms;
                    property.floorplans[i].bathrooms = old.bathrooms;
                    property.floorplans[i].description = old.description;
                    property.floorplans[i].units = old.units;
                    property.floorplans[i].sqft = old.sqft;

                    //property.floorplans[i].amenities = _.pluck(_.filter(amenities, function(x) {return property.floorplans[i].amenities.indexOf(x._id.toString()) > -1}),"name");

                }
            })

            PropertyHelperService.fixAmenities(property, amenities);
            // console.log(property);
            // callback([{msg: 'test'}]);
            // return;

            CreateService.update(req.user,req.context, o._id,property,callback);
        });
    });
}

function propertyFloorplanAmenitiesUpdatedUndo  (req, o, callback) {
    AmenitiesService.search({}, function(err, amenities) {
        PropertyService.search(req.user, {_id: o.property.id, select: "*", permission: ['CompManage','PropertyManage']}, function (er, props) {
            var property = props[0];


            property.floorplans.forEach(function (fp, i) {
                if (fp.id.toString() == o.data[0].fpid.toString()) {

                    o.data.forEach(function (d) {
                        if (d.type == 'added') {
                            _.pull(property.floorplans[i].amenities, d.id);
                        } else {
                            property.floorplans[i].amenities.push(d.id);
                        }

                    })


                    property.floorplans[i].amenities = _.uniq(property.floorplans[i].amenities);

                }

            })

            PropertyHelperService.fixAmenities(property, amenities);
            // console.log(property);
            // callback([{msg: 'test'}]);
            // return;

            CreateService.update(req.user,req.context, o._id,property,callback);

        });
    });
}

function userUpdatedUndo  (req, o, callback) {
    UserService.search(req.user, {_id: o.user.id, select: "_id first last email"}, function (er, users) {
        var user = users[0];

        o.data.forEach(function (d) {
            user[d.field] = d.old_value;
        })

        UserCreateService.update(req.user, req.context, o._id, user, callback);
    });
}

function userAssignedUndo  (req, o, callback) {
    PropertyUserService.unlink(req.user,req.context, o._id, o.data[0].userid,o.data[0].propertyid,callback)
}

function userUnAssignedUndo  (req, o, callback) {
    PropertyUserService.link(req.user,req.context, o._id, o.data[0].userid,o.data[0].propertyid,callback)
}

function getPropertiesAndComps (req, callback) {

    async.parallel({
        subjects: function(callbackp) {
            PropertyService.search(req.user, {permission: ['PropertyManage'], select: '_id name', limit: 1000}, function(err, properties) {
                callbackp(null, properties)
            })
        },
        comps: function(callbackp) {
            PropertyService.search(req.user, {permission: ['CompManage'], select: '_id name', limit: 1000}, function(err, properties) {
                callbackp(null, properties)
            })
        }
    }, function(err,all) {

        _.remove(all.comps, function(c) {return _.find(all.subjects, function(s) { return s._id.toString() == c._id.toString()})})

        all.comps.forEach(function(c) {
            c.name += " (Comp)";
        })
        callback(null, all.subjects, all.comps)
    })

}