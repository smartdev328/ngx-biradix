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
        query = query.sort({type: 1, name: 1});
        query.exec(callback);
    },
    create: function (operator, context, amenity, callback) {

        var modelErrors = [];

        amenity.name = amenity.name || '';
        amenity.type = amenity.type || '';

        if (amenity.name == '') {
            modelErrors.push({msg: 'Amenity name is required.'});
            callback(modelErrors, null);
            return;
        }

        if (amenity.type == '') {
            modelErrors.push({msg: 'Amenity type is required.'});
            callback(modelErrors, null);
            return;
        }

        AmenitySchema.find(



        {
            $or : [
                {"name": {$regex: new RegExp(amenity.name, "i")}},
                {"aliases": {$regex: new RegExp(amenity.name, "i")}}
            ],type: amenity.type
        }


            , function (err, dupe) {

            if (err) {
                modelErrors.push({msg: 'Unexpected Error. Unable to create organziaion.'});
                callback(modelErrors, null);
                return;
            }

            if (dupe && dupe.length > 0) {

                if (dupe[0].deleted === true) {
                    return callback([{msg: 'Amenity ' + amenity.name + ' is not a valid Amenity'}], null);
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
                    modelErrors.push({msg: 'Unexpected Error. Unable to create organziaion.'});
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

    update: function (operator, context, amenity, callback) {

        var modelErrors = [];

        amenity.name = amenity.name || '';

        if (amenity.name == '') {
            modelErrors.push({msg: 'Amenity name is required.'});
            callback(modelErrors, null);
            return;
        }

        AmenitySchema.find({"_id": amenity._id}, function (err, old) {
            AmenitySchema.find({
                "name": {$regex: new RegExp(amenity.name, "i")},
                type: amenity.type
            }, function (err, dupe) {

                if (err || !old || !old.length == 1) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to update amenity.'});
                    callback(modelErrors, null);
                    return;
                }

                if (dupe && dupe.length > 0 && dupe[0]._id.toString() != amenity._id.toString()) {

                    return callback([{msg: amenity.name + ' is a duplicate Amenity'}], null);

                }

                var query = {_id: amenity._id};
                var update = {approved: true, name: amenity.name};
                var options = {};

                AmenitySchema.findOneAndUpdate(query, update, options, function (err, saved) {

                    if (err) {
                        modelErrors.push({msg: 'Unable to update amenity.'});
                        callback(modelErrors, null);
                        return;
                    }

                    var description = "";
                    if (!old[0].approved || old[0].name != amenity.name) {
                        description = "(" + old[0].type + ") " + old[0].name + ": ";

                        if (old[0].name != amenity.name) {
                            description += amenity.name;
                        }

                        if (!old[0].approved) {
                            if (old[0].name != amenity.name) {
                                description += " / Approved"
                            } else {
                                description += "Approved"
                            }
                        }
                    }


                    if (description) {
                        AuditService.create({
                            operator: operator,
                            amenity: old[0],
                            type: 'amenity_updated',
                            description: description,
                            context: context
                        })
                    }

                    return callback(err, saved)
                })

                // return callback([{msg: 'Test'}], null);


            })
        });
    },

    updateAliases: function (operator, context, amenity, callback) {

        var modelErrors = [];

        amenity.aliases = amenity.aliases || [];

        var query = {_id: amenity._id};
        var update = {aliases: amenity.aliases};
        var options = {};

        AmenitySchema.findOneAndUpdate(query, update, options, function (err, saved) {

            if (err) {
                modelErrors.push({msg: 'Unable to update amenity.'});
                callback(modelErrors, null);
                return;
            }


            return callback(err, saved)
        })

    }
}