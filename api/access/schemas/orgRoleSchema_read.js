'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    name: {
        type: String
    },
    isadmin: {
        type: Boolean,
        default: false
    },
    orgid: {
        type: Schema.Types.ObjectId,
        index: true
    },
    tags: {
        type: Array,
        index: true
    },
    org: {
        type: Object
    }
});

module.exports = mongoose.model('OrgRole_read', s);