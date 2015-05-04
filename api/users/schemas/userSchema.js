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
    salt: String,
    date: Date,
    title: String
});

module.exports = mongoose.model('User', UserSchema);
