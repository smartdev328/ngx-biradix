'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    name: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    zip: {
        type: String
    },
    phone: {
        type: String
    },
    contactName: {
        type: String
    },
    contactEmail: {
        type: String
    },
    yearBuilt: {
        type: Number
    },
    yearRenovated: {
        type: Number
    },
    constructionType: {
        type: String
    },
    owner: {
        type: String
    },
    management: {
        type: String
    },
    loc: {
        type: [Number],  // [<longitude>, <latitude>]
        index: '2d'      // create the geospatial index
    },
    date: Date,
    active: Boolean,
    notes: String,
    fees: {}

});

module.exports = mongoose.model('Property', s, 'properties');
