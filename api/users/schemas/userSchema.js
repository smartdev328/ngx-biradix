'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    first: {
        type: String
    },
    last: {
        type: String
    },
    email: {
        type: String
    },
    emailLower: {
        type: String,
        unique: true,
        index: true
    },
    hashed_password: {
        type: String
    },
    legacyHash: String,
    active: Boolean,
    salt: String,
    date: Date,
    isSystem: Boolean,
    settings: {
        hideUnlinked: Boolean,
        defaultPropertyId: Schema.Types.ObjectId,
        notifications: {},
        showLeases: Boolean
    },
    passwordUpdated: Boolean,
    bounceReason: String
});

module.exports = mongoose.model('User', UserSchema);
