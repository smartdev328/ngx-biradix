'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    name: {
        type: String
    },
    subdomain: {
        type: String
    },
    logoBig: {
        type: String
    },
    logoSmall: {
        type: String
    },
    isDefault: Boolean,
    settings : {}
});

module.exports = mongoose.model('Organization', s);
