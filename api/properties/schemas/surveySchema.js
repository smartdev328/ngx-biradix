'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    date: {
        type: Date,
        index: true
    },
    leased: Number,
    renewal: Number,
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
    community_amenities: Array,
    notes: String,
    doneByOwner : Boolean
});

s.index({"propertyid": 1, "date": 1});

module.exports = mongoose.model('Survey', s);
