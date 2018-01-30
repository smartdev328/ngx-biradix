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
        reminders: {},
        showLeases: Boolean,
        showATR: Boolean,
        showRenewal: Boolean,
        tz: String,
        monthlyConcessions: Boolean,
        defaultRole: String,
        notification_columns: {}
    },
    passwordUpdated: Boolean,
    bounceReason: String,
    bounceDate: String,
    guestStats: Array,
    search: String
});

module.exports = mongoose.model('User', UserSchema);
