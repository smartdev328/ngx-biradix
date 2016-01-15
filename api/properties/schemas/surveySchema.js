'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    date: {
        type: Date,
        index: true
    },
    leased: Number,
    occupancy: Number,
    weeklytraffic: Number,
    weeklyleases: Number,
    propertyid: {
        type: Schema.Types.ObjectId,
        index: true
    },
    floorplans: Array,
    exclusions: Array,
    location_amenities: Array,
    community_amenities: Array
});

module.exports = mongoose.model('Survey', s);
