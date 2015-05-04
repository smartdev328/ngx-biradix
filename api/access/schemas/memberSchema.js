'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    userid: {
        type: Schema.Types.ObjectId,
        index: true
    },
    roleid: {
        type: Schema.Types.ObjectId,
        index: true
    }
});

module.exports = mongoose.model('Membership', s);
