'use strict';
var async = require("async");
var _ = require("lodash")
var PropertyService = require('../../properties/services/propertyService')
var PropertyHelperService = require('../../properties/services/propertyHelperService')
var AmenityService = require('../../amenities/services/amenityService')
var AuditService = require('../../audit/services/auditService')
var CreateService = require('../../properties/services/createService')

module.exports = {
    unDeleteAmenity: function (operator, context, revertedFromId, amenityid, properties, callback) {
        async.parallel({
                properties: function(callbackp) {
                    PropertyService.search(operator,
                        {
                            ids: _.pluck(properties,"_id"),
                            limit: 10000,
                            select: "*", sort: "name"
                        }, function(err,properties) {
                            //console.log(properties);
                            callbackp(err,properties);
                        }
                    );
                },
                amenity: function (callbackp)  {
                    AmenityService.search(
                        {
                            id: amenityid,
                        }, callbackp
                    );
                },
                amenities: function(callbackp) {
                    AmenityService.search({}, function(err, amenities) {
                        callbackp(err, amenities)
                    });
                }

            }, function(err,all) {
            //console.log(all);

            if (!all.amenity || !all.amenity.length || !all.amenity[0].deleted) {
                return callback([{msg: all.amenity[0].name + ' is NOT marked as deleted'}]);
            }

            var amenity = all.amenity[0];
            amenity.deleted = false;

            var propsDescription = _.map(all.properties,"name").join(", ");

            all.properties.forEach(function(p) {
                if (amenity.type == "Unit") {
                    p.floorplans.forEach(function(fp) {
                        fp.amenities = fp.amenities.map(function(x) {return x.toString()});
                        fp.amenities.push(amenityid.toString());
                    })
                } else if (amenity.type == 'Community') {
                    p.community_amenities = p.community_amenities.map(function(x) {return x.toString()});
                    p.community_amenities.push(amenityid.toString());
                } else if (amenity.type == 'Location') {
                    p.location_amenities = p.location_amenities.map(function(x) {return x.toString()});
                    p.location_amenities.push(amenityid.toString());
                }

                PropertyHelperService.fixAmenities(p,all.amenities);
            })

            AmenityService.updateDeleted(operator,context,amenity, function(err,obj) {
                if (err) {
                    return callback(err);
                }

                AuditService.create({
                    operator: operator,
                    amenity: amenity,
                    type: 'amenity_undeleted',
                    revertedFromId: revertedFromId,
                    description: "(Undeleted) " + amenity.type + ': ' + amenity.name + ": " + all.properties.length + " properties affected.",
                    context: context,
                    data: [{amenityid: amenityid, description: propsDescription}]
                })

                async.eachLimit(all.properties, 20, function(property, callbackp){
                    CreateService.update(operator, context, property._id, property, callbackp);
                }, function(err) {
                    callback(null);
                });

            })

        })

    },

    deleteAmenity: function (operator, context, revertedFromId, amenityid, callback) {
        async.parallel({
            properties: function(callbackp) {
                PropertyService.search(operator,
                    {
                        amenity: amenityid,
                        limit: 10000,
                        select: "*", sort: "name"
                    }, function(err,properties) {
                        //console.log(properties);
                        callbackp(err,properties);
                    }
                );
            },
            amenity: function (callbackp)  {
                AmenityService.search(
                    {
                        id: amenityid,
                    }, callbackp
                );
            },
            amenities: function(callbackp) {
                AmenityService.search({}, function(err, amenities) {
                   callbackp(err, amenities)
                });
            }

        }, function(err,all) {
            // console.log(all.properties);

            if (!all.amenity || !all.amenity.length || all.amenity[0].deleted) {
                return callback([{msg: all.amenity[0].name + ' is already marked as deleted'}]);
            }

            var amenity = all.amenity[0];
            amenity.deleted = true;

            var props = [];
            var propsDescription = _.map(all.properties,"name").join(", ");
            
            all.properties.forEach(function(p) {
                //console.log(p);
                var p2 = {_id: p._id}

                var fps = [];

                if (amenity.type == "Unit") {
                    p.floorplans.forEach(function(fp) {
                        fp.amenities = fp.amenities.map(function(x) {return x.toString()});
                        if (fp.amenities.indexOf(amenityid.toString()) > -1) {
                            fps.push(fp.id.toString());
                            // console.log(fp.amenities,amenityid,fp.amenities.length);
                            _.remove(fp.amenities,function(x) {return x.toString() == amenityid.toString()});
                            // console.log(fp.amenities,amenityid,fp.amenities.length);
                        }
                    })
                } else if (amenity.type == 'Community') {
                    p.community_amenities = p.community_amenities.map(function(x) {return x.toString()});
                    _.remove(p.community_amenities,function(x) {return x.toString() == amenityid.toString()});
                } else if (amenity.type == 'Location') {
                    p.location_amenities = p.location_amenities.map(function(x) {return x.toString()});
                    _.remove(p.location_amenities,function(x) {return x.toString() == amenityid.toString()});
                }
                p2.floorplans = fps;

                props.push(p2);

                PropertyHelperService.fixAmenities(p,all.amenities);
            })

            // console.log(props);
            //
            //  return callback([{msg: 'Test'}]);

            async.eachLimit(all.properties, 20, function(property, callbackp){
                CreateService.update(operator, context, property._id, property, callbackp);
            }, function(err) {
                AmenityService.updateDeleted(operator,context,amenity, function(err,obj) {
                    if (err) {
                        return callback(err);
                    }

                    AuditService.create({
                        operator: operator,
                        amenity: amenity,
                        type: 'amenity_deleted',
                        revertedFromId: revertedFromId,
                        description: "(Deleted) " + amenity.type + ': ' + amenity.name + ": " + all.properties.length + " properties affected.",
                        context: context,
                        data: [{amenityid: amenityid, properties: props, description: propsDescription}]
                    })
                    callback(null);
                })
            });

        })


    },

    mapAmenity: function (operator, context, revertedFromId, amenityid, newid, callback) {
        async.parallel({
            properties: function(callbackp) {
                PropertyService.search(operator,
                    {
                        amenity: amenityid,
                        limit: 10000,
                        select: "*", sort: "name"
                    }, function(err,properties) {
                        //console.log(properties);
                        callbackp(err,properties);
                    }
                );
            },
            amenities: function(callbackp) {
                AmenityService.search({}, function(err, amenities) {
                    callbackp(err, amenities)
                });
            }

        }, function(err,all) {
            // console.log(all.properties);

            var oldamenity = _.find(all.amenities, function(x) {return x._id == amenityid});
            var newamenity = _.find(all.amenities, function(x) {return x._id == newid});

            if (!oldamenity || oldamenity.deleted) {
                return callback([{msg: "Can't map a deleted amenity"}]);
            }

            if (!newamenity || newamenity.deleted) {
                return callback([{msg: "Can't map to a deleted amenity"}]);
            }

            newamenity.aliases.push(oldamenity.name);
            AmenityService.updateAliases(operator,context,newamenity, function() {

                var props = [];
                var propsDescription = _.map(all.properties,"name").join(", ");

                all.properties.forEach(function(p) {
                    //console.log(p);
                    var p2 = {_id: p._id}

                    var fps = [];

                    if (oldamenity.type == "Unit") {
                        p.floorplans.forEach(function(fp) {
                            fp.amenities = fp.amenities.map(function(x) {return x.toString()});
                            if (fp.amenities.indexOf(amenityid.toString()) > -1) {
                                fps.push(fp.id.toString());
                                _.remove(fp.amenities,function(x) {return x.toString() == amenityid.toString()});
                                fp.amenities.push(newid);
                            }
                        })
                    } else if (oldamenity.type == 'Community') {
                        p.community_amenities = p.community_amenities.map(function(x) {return x.toString()});
                        _.remove(p.community_amenities,function(x) {return x.toString() == amenityid.toString()});
                        p.community_amenities.push(newid);
                    } else if (oldamenity.type == 'Location') {
                        p.location_amenities = p.location_amenities.map(function(x) {return x.toString()});
                        _.remove(p.location_amenities,function(x) {return x.toString() == amenityid.toString()});
                        p.location_amenities.push(newid);
                    }
                    p2.floorplans = fps;

                    props.push(p2);

                    PropertyHelperService.fixAmenities(p,all.amenities);
                })


                async.eachLimit(all.properties, 20, function(property, callbackp){
                    CreateService.update(operator, context, property._id, property, callbackp);
                }, function(err) {
                    AmenityService.delete(operator,context,oldamenity, function(err,obj) {
                        if (err) {
                            return callback(err);
                        }

                        AuditService.create({
                            operator: operator,
                            amenity: oldamenity,
                            type: 'amenity_mapped',
                            revertedFromId: revertedFromId,
                            description: "(Mapped) " + oldamenity.type + ': ' + oldamenity.name + " => " + newamenity.name + ": " + all.properties.length + " properties affected.",
                            context: context,
                            data: [{amenityid: amenityid, properties: props, description: propsDescription}]
                        })
                        callback(null);
                    })
                });                
                
                
            })





        })


    }
}
