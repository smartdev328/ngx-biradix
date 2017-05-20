'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    ownerid: {type: Schema.Types.ObjectId, index:true},
    orgid: {type: Schema.Types.ObjectId, index:true},
    date: {type: Date, index:true},
    settings : Object,
    reportids: Array,
    name: String
});

module.exports = mongoose.model('SavedReport', s);
