'use strict';
var async = require("async");
var _ = require("lodash")
var PropertyService = require('../../properties/services/propertyService')
var PropertyHelperService = require('../../properties/services/propertyHelperService')
var AmenityService = require('../../amenities/services/amenityService')
var AuditService = require('../../audit/services/auditService')
var CreateService = require('../../properties/services/createService')

module.exports = {
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
                        description: amenity.type + ': ' + amenity.name + " deleted, " + all.properties.length + " properties affected.",
                        context: context,
                        data: [{amenityid: amenityid, properties: props, description: propsDescription}]
                    })
                    callback(null);
                })
            });

        })


    }
}
