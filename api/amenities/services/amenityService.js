'use strict';
var AmenitySchema= require('../schemas/amenitySchema')
var async = require("async");
var _ = require("lodash")
var AuditService = require('../../audit/services/auditService')

module.exports = {
    search: function (criteria, callback) {
        var query = AmenitySchema.find({});

        if (criteria.active) {
            query = query.where("deleted").equals(false);
        }
        query = query.sort("name");
        query.exec(callback);
    },
    create: function(operator, context, amenity, callback) {

        var modelErrors = [];

        amenity.name = amenity.name || '';
        amenity.type = amenity.type || '';

        if (amenity.name == '' ) {
            modelErrors.push({msg : 'Amenity name is required.'});
            callback(modelErrors, null);
            return;
        }

        if (amenity.type == '' ) {
            modelErrors.push({msg : 'Amenity type is required.'});
            callback(modelErrors, null);
            return;
        }

        AmenitySchema.find({ "name" : { $regex : new RegExp(amenity.name, "i") }, type: amenity.type }, function(err, dupe) {

            if (err) {
                modelErrors.push({msg : 'Unexpected Error. Unable to create organziaion.'});
                callback(modelErrors, null);
                return;
            }

            if (dupe && dupe.length > 0) {

                if (dupe[0].deleted === true) {
                    return callback([{msg : 'Amenity ' + amenity.name + ' is not a valid Amenity'}], null);
                }
                else {
                    return callback(null, dupe[0]);
                }


            }

            var n = new AmenitySchema();

            n.name = amenity.name;
            n.type = amenity.type;
            n.approved = false;
            n.deleted = false;

            n.save(function (err, am) {

                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to create organziaion.'});
                    callback(modelErrors, null);
                    return;
                }

                callback(null, am);

                AuditService.create({
                    operator: operator,
                    amenity: am,
                    type: 'amenity_created',
                    description: amenity.type + ': ' + amenity.name,
                    context: context
                })

            });
        })


    },

}