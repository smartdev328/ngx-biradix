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
                var historyproperty = _.find(properties, function(x) {return x._id.toString() == p._id.toString()})

                if (amenity.type == "Unit") {
                    p.floorplans.forEach(function(fp) {
                        fp.amenities = fp.amenities.map(function(x) {return x.toString()});

                        if (historyproperty.floorplans.indexOf(fp.id.toString()) == -1) {
                            fp.amenities.push(amenityid.toString());
                        }

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
                    CreateService.update(operator, context, revertedFromId, property, {skipGeo: true}, callbackp);
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
                CreateService.update(operator, context, revertedFromId, property, {skipGeo: true}, callbackp);
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
    unMapAmenity: function (operator, context, revertedFromId, oldamenity, newid, properties, callback) {
        async.parallel({
                properties: function (callbackp) {
                    PropertyService.search(operator,
                        {
                            ids: _.pluck(properties,"_id"),
                            limit: 10000,
                            select: "*", sort: "name"
                        }, function (err, properties) {
                            //console.log(properties);
                            callbackp(err, properties);
                        }
                    );
                },
                amenities: function (callbackp) {
                    AmenityService.search({}, function (err, amenities) {
                        callbackp(err, amenities)
                    });
                }

            }, function (err, all) {
            var newamenity = _.find(all.amenities, function(x) {return x._id == newid});

            if (!newamenity) {
                return callback([{msg: "Can't find amenity"}]);
            }

            if (newamenity.aliases.indexOf(oldamenity.name) == -1) {
                return callback([{msg: oldamenity.name + " is no longer an Alias of " + newamenity.name}]);
            }
            _.remove(newamenity.aliases,function(x) {return x == oldamenity.name});

            AmenityService.updateAliases(operator,context,newamenity,function() {
                AmenityService.create(operator,context,oldamenity, function(err, createdamenity) {

                    all.amenities.push(createdamenity);
                    var propsDescription = _.map(all.properties,"name").join(", ");

                    all.properties.forEach(function(p) {
                        var historyproperty = _.find(properties, function(x) {return x._id.toString() == p._id.toString()})

                        if (newamenity.type == "Unit") {
                            p.floorplans.forEach(function(fp) {
                                fp.amenities = fp.amenities.map(function(x) {return x.toString()});

                                if (historyproperty.floorplansAdded.indexOf(fp.id.toString()) > -1) {
                                    var removed = _.remove(fp.amenities,function(x) {return x.toString() == newid.toString()});
                                }

                                if (historyproperty.floorplansRemoved.indexOf(fp.id.toString()) > -1) {
                                    fp.amenities.push(createdamenity._id.toString());
                                }
                            })
                        } else if (oldamenity.type == 'Community') {
                            p.community_amenities = p.community_amenities.map(function(x) {return x.toString()});

                            if (historyproperty.added) {
                                _.remove(p.community_amenities, function (x) {
                                    return x.toString() == newid.toString()
                                });
                            }

                            p.community_amenities.push(createdamenity._id.toString());

                        } else if (oldamenity.type == 'Location') {
                            p.location_amenities = p.location_amenities.map(function(x) {return x.toString()});

                            if (historyproperty.added) {
                                _.remove(p.location_amenities, function (x) {
                                    return x.toString() == newid.toString()
                                });
                            }

                            p.location_amenities.push(createdamenity._id.toString());

                        }

                        PropertyHelperService.fixAmenities(p,all.amenities);

                    })

                    AuditService.create({
                        operator: operator,
                        amenity: createdamenity,
                        type: 'amenity_unmapped',
                        revertedFromId: revertedFromId,
                        description: "(Unmapped) " + createdamenity.type + ': ' + createdamenity.name + " ~ " + newamenity.name + ": " + all.properties.length + " properties affected.",
                        context: context,
                        data: [{amenityid: createdamenity._id.toString(), newid: newid, description: propsDescription}]
                    })

                    async.eachLimit(all.properties, 20, function(property, callbackp){
                        CreateService.update(operator, context, revertedFromId, property, {skipGeo: true}, callbackp);
                    }, function(err) {
                        callback(null);
                    });
                })
            })


            }
        );
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

            var oldamenity = _.find(all.amenities, function(x) {return x._id.toString() == amenityid.toString()});
            var newamenity = _.find(all.amenities, function(x) {return x._id.toString() == newid.toString()});

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

                    var fpsAdded = [];
                    var fpsRemoved = [];

                    if (oldamenity.type == "Unit") {
                        p.floorplans.forEach(function(fp) {
                            fp.amenities = fp.amenities.map(function(x) {return x.toString()});
                            if (fp.amenities.indexOf(amenityid.toString()) > -1) {
                                fpsRemoved.push(fp.id.toString());
                                _.remove(fp.amenities,function(x) {return x.toString() == amenityid.toString()});

                                if (fp.amenities.indexOf(newid.toString()) == -1) {
                                    fp.amenities.push(newid.toString());
                                    fpsAdded.push(fp.id.toString());
                                }
                            }
                        })
                    } else if (oldamenity.type == 'Community') {
                        p.community_amenities = p.community_amenities.map(function(x) {return x.toString()});
                        _.remove(p.community_amenities,function(x) {return x.toString() == amenityid.toString()});

                        if (p.community_amenities.indexOf(newid.toString()) == -1) {
                            p.community_amenities.push(newid.toString());
                            p2.added = true;
                        }
                    } else if (oldamenity.type == 'Location') {
                        p.location_amenities = p.location_amenities.map(function(x) {return x.toString()});
                        _.remove(p.location_amenities,function(x) {return x.toString() == amenityid.toString()});

                        if (p.location_amenities.indexOf(newid.toString()) == -1) {
                            p.location_amenities.push(newid.toString());
                            p2.added = true;
                        }
                    }
                    p2.floorplansAdded = fpsAdded;
                    p2.floorplansRemoved = fpsRemoved;

                    props.push(p2);

                    PropertyHelperService.fixAmenities(p,all.amenities);
                })


                async.eachLimit(all.properties, 20, function(property, callbackp){
                    CreateService.update(operator, context, revertedFromId, property, {skipGeo: true}, callbackp);
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
                            data: [{amenity: oldamenity, newid : newid, properties: props, description: propsDescription}]
                        })
                        callback(null);
                    })
                });                
                
                
            })





        })


    }
}
