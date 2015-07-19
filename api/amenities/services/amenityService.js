'use strict';
var AmenitySchema= require('../schemas/amenitySchema')
var async = require("async");
var _ = require("lodash")


module.exports = {
    search: function (callback) {
        var query = AmenitySchema.find({});
        query = query.sort("name");
        query.exec(callback);
    },
    create: function(amenity, callback) {

        var modelErrors = [];
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

       });

    },

}