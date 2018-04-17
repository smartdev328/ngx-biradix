"use strict";
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const s = new Schema({
    name: {
        type: String,
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    zip: {
        type: String,
    },
    phone: {
        type: String,
    },
    contactName: {
        type: String,
    },
    contactEmail: {
        type: String,
    },
    website: {
        type: String,
    },
    yearBuilt: {
        type: Number,
    },
    yearRenovated: {
        type: Number,
    },
    constructionType: {
        type: String,
    },
    owner: {
        type: String,
    },
    management: {
        type: String,
    },
    loc: {
        type: [Number], // [<longitude>, <latitude>]
        index: "2d", // create the geospatial index
    },
    date: Date,
    active: Boolean,
    needsApproval: Boolean,
    needsSurvey: Boolean,
    notes: String,
    fees: {},
    orgid: {
        type: Schema.Types.ObjectId,
    },
    floorplans: Array,
    totalUnits: Number,
    location_amenities: Array,
    community_amenities: Array,
    comps: Array,
    survey: {},
    media: [],
    custom: {},
});

s.index({"comps.id": 1});

module.exports = mongoose.model("Property", s, "properties");
