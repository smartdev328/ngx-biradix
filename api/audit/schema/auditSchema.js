"use strict";
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let s = new Schema({
    operator: {
        id: {type: Schema.Types.ObjectId, index: true},
        name: String,
    },
    user: {
        id: {type: Schema.Types.ObjectId, index: true},
        name: String,
    },
    property: {
        id: {type: Schema.Types.ObjectId, index: true},
        orgid: {type: Schema.Types.ObjectId},
        name: String,
    },
    amenity: {
        id: Schema.Types.ObjectId,
        name: String,
    },
    type: {type: String, index: true},
    description: String,
    date: {type: Date, index: true},
    context: {
        ip: String,
        user_agent: String,
    },
    reverted: Boolean,
    revertedFromId: Schema.Types.ObjectId,
    data: Object,
    adminOnly: Object,
    dataIntegrityViolations: [],
});

s.index({"type": 1, "date": 1});

module.exports = mongoose.model("Audit", s);
