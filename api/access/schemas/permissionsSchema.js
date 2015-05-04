'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    executorid: {
        type: Schema.Types.ObjectId,
        index: true
    },
    resource: {
        type: String,
        index: true
    },
    allow: {
        type: Boolean,
        default: true
    },
    type: String
});

module.exports = mongoose.model('Permission', s);
