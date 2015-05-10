'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var RoleSchema = new Schema({
    name: {
        type: String
    },
    parentid: {
        type: Schema.Types.ObjectId,
        index: true
    },
    upline: {
        type: Array,
        index: true
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
    }
});

module.exports = mongoose.model('Role', RoleSchema);