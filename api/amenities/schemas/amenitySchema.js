'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    name: {
        type: String
    },
    type: {
        type: String
    },
    approved: Boolean,
    deleted: Boolean,
    aliases: {
        type: Array,
    }

});

module.exports = mongoose.model('Amenity', s, 'amenities');
