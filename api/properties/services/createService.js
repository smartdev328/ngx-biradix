'use strict';
var PropertySchema= require('../schemas/propertySchema')
var async = require("async");
var _ = require("lodash")
var uuid = require('node-uuid');
var moment = require('moment');
var AuditService = require('../../audit/services/auditService')
var CompsService = require('./compsService')
var GeocodeService = require('../../utilities/services/geocodeService')
var AccessService = require('../../access/services/accessService')
var AmenityService = require('../../amenities/services/amenityService')

module.exports = {
    update: function(operator, context,revertedFromId, property, callback) {

        var modelErrors = [];

        errorCheck(property, modelErrors);


        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }

        getHelpers(property,  function(err, all) {
            if (err) {
                return callback([{msg: err}], null)
            }

            populateAmenitiesandFloorplans(property, all);

            PropertySchema.findOne({_id:property._id}, function(err, n) {

                if (err || !n) {
                    return callback([{msg:"Unable to update property. Please contact the administrator."}], null)
                }

                populateSchema(property, n, all);

                n.save(function (err, prop) {

                    if (err) {
                        return callback([{msg: "Unable to update property. Please contact the administrator."}], null)
                    }

                    callback(null, n);
                });


            })
        });

    },
    create: function(operator, context, property, callback) {

        var modelErrors = [];

        errorCheck(property, modelErrors);


        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }

        getHelpers(property,  function(err, all)
            {
                if (err) {
                    return callback([{msg:err}],null)
                }

                populateAmenitiesandFloorplans(property, all);

                //////////////////
                var CMs = [];
                var permissions = [];
                if (property.orgid) {
                    //if org of property is provided, assign manage to all CMs for that org
                    CMs = _.filter(all.roles, function(x) {return x.orgid == property.orgid.toString() && x.tags.indexOf('CM') > -1})

                    CMs.forEach(function(x) {
                        permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyManage'})
                    })

                }

                //and assign view opermissions to all non admins and not POs
                var viewers = _.filter(all.roles, function(x) {
                    return x.tags.indexOf('CM') > -1 || x.tags.indexOf('RM') > -1 || x.tags.indexOf('BM') > -1})


                viewers.forEach(function(x) {
                    permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyView'})
                })


                var n = new PropertySchema();

                populateSchema(property, n, all);

                n.active = true;
                n.orgid = property.orgid;
                n.comps = [];
                n.date = Date.now();

                n.save(function (err, prop) {

                    if (err) {
                        return callback([{msg:"Unable to create property. Please contact the administrator."}], null)
                    }

                    AuditService.create({operator: operator, property: prop, type: 'property_created', description: prop.name, context: context})

                    if (permissions.length > 0 ) {
                        permissions.forEach(function(x) {
                            x.resource = prop._id.toString();
                        })
                    }

                    async.eachLimit(permissions, 10, function(permission, callbackp){
                        AccessService.createPermission(permission, function (err, perm) {
                            callbackp(err, perm)
                        });
                    }, function(err) {
                        //link to yourself to treat yourself as a comp
                        CompsService.linkComp(null,null,null,false,prop._id, prop._id,function() {
                            if (!err) {
                                callback(null, prop);
                            } else {
                                callback([{msg: err}], prop);
                            }
                        })
                    });
                });

            }
        );

    },
}

function errorCheck(property, modelErrors) {
    property = property || {};
    property.name = property.name || '';
    property.address = property.address || '';
    property.city = property.city || '';
    property.state = property.state || '';
    property.constructionType = property.constructionType || '';
    property.owner = property.owner || '';
    property.management = property.management || '';
    property.yearBuilt = property.yearBuilt || '';
    property.floorplans = property.floorplans || [];

    if (property.name == '') {
        modelErrors.push({param: 'name', msg : 'Please enter the Property Name'});
    }

    if (property.address == '') {
        modelErrors.push({param: 'address', msg : 'Please enter the Property Address'});
    }

    if (property.city == '') {
        modelErrors.push({param: 'city', msg : 'Please enter the Property City'});
    }

    if (property.state == '' || property.state.length != 2) {
        modelErrors.push({param: 'state', msg : 'Please enter the Property State'});
    }

    if (property.constructionType == '') {
        modelErrors.push({param: 'constructionType', msg : 'Please enter the Construction Type'});
    }

    if (property.owner == '') {
        modelErrors.push({param: 'owner', msg : 'Please enter the Owner'});
    }

    if (property.management == '') {
        modelErrors.push({param: 'management', msg : 'Please enter the Management'});
    }

    if (property.yearBuilt == '') {
        modelErrors.push({param: 'yearBuilt', msg : 'Please enter the Year Built'});
    }

    if (isNaN(property.yearBuilt) || parseInt(property.yearBuilt) < 1900 || parseInt(property.yearBuilt) > (new Date()).getFullYear() + 5) {
        modelErrors.push({param: 'yearBuilt', msg : 'Please enter a valid Year Built'});
    }

    if (property.yearRenovated && (isNaN(property.yearRenovated) || parseInt(property.yearRenovated) < 1900 || parseInt(property.yearRenovated) > (new Date()).getFullYear() + 5)) {
        modelErrors.push({param: 'yearRenovated', msg : 'Please enter a valid Year Renovated'});
    }

    property.floorplans.forEach(function(fp) {
        if (typeof fp.bedrooms == 'undefined' || isNaN(fp.bedrooms) || parseInt(fp.bedrooms) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of bedrooms'});
        }

        if (!fp.bathrooms || isNaN(fp.bathrooms) || parseFloat(fp.bathrooms) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of bathrooms'});
        }

        if (!fp.units || isNaN(fp.units) || parseInt(fp.units) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of units'});
        }

        if (!fp.sqft || isNaN(fp.sqft) || parseInt(fp.sqft) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of square feet'});
        }
    })
}

var getHelpers = function(property, callback) {
    async.parallel({
        geo: function (callbackp) {

            GeocodeService.geocode(property.address + ' ' + property.city + ' ' + property.state + ' ' + property.zip, true, function (err, res, fromCache) {
                //console.log(res[0].latitude, res[0].longitude);
                callbackp(err, res[0])
            });
        },
        roles: function (callbackp) {
            AccessService.getRoles(function(err, roles) {
                callbackp(err, roles)
            })

        },
        amenities: function (callbackp) {
            AmenityService.search({active: true},function(err, amenities) {
                callbackp(err, amenities)
            })

        }

    },  function(err, all) {
        callback(err, all)
    })
}

var populateAmenitiesandFloorplans = function(property, all) {
    property.totalUnits = 0;

    //find all amenities by name and conver to id;
    var community_amenities = [];
    (property.community_amenities || []).forEach(function(pa) {
        var am = _.find(all.amenities, function(a) {return pa == a.name && a.type == 'Community'})
        if (am) {
            community_amenities.push(am._id);
        }
    })

    property.community_amenities = community_amenities;

    var location_amenities = [];
    (property.location_amenities || []).forEach(function(pa) {
        var am = _.find(all.amenities, function(a) { return pa == a.name && a.type == 'Location'})
        if (am) {
            location_amenities.push(am._id);
        }
    })

    property.location_amenities = location_amenities;

    property.floorplans.forEach(function(fp) {
        property.totalUnits += (fp.units || 0);

        if (!fp.id) {
            fp.id = uuid.v1();
        }

        var amenities = [];
        (fp.amenities || []).forEach(function(pa) {
            var am = _.find(all.amenities, function(a) { return pa == a.name && a.type == 'Unit'})
            if (am) {
                amenities.push(am._id);
            }
        })
        fp.amenities = amenities;

    })
}

function populateSchema(property, n, all) {
    n.loc = [all.geo.latitude, all.geo.longitude]
    n.name = property.name;
    n.address = property.address;
    n.city = property.city;
    n.state = property.state;
    n.zip = property.zip;
    n.phone = property.phone;
    n.owner = property.owner;
    n.contactEmail = property.contactEmail;
    n.contactName = property.contactName;
    n.management = property.management;
    n.yearBuilt = property.yearBuilt;
    n.yearRenovated = property.yearRenovated
    n.constructionType = property.constructionType;
    n.notes = property.notes;
    n.fees = property.fees;
    n.floorplans = property.floorplans;
    n.totalUnits = property.totalUnits;
    n.location_amenities = property.location_amenities;
    n.community_amenities = property.community_amenities;
}