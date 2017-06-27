'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    operator: {
        id : {type: Schema.Types.ObjectId, index:true},
        name: String
    },
    user: {
        id : {type: Schema.Types.ObjectId, index:true},
        name: String
    },
    property: {
        id : {type: Schema.Types.ObjectId, index:true},
        orgid : {type: Schema.Types.ObjectId},
        name: String
    },
    amenity: {
        id : Schema.Types.ObjectId,
        name: String
    },
    type : {type: String, index: true},
    description: String,
    date: {type: Date, index:true},
    context: {
        ip: String,
        user_agent: String
    },
    reverted : Boolean,
    revertedFromId : Schema.Types.ObjectId,
    data : Object,
    adminOnly : Object
});

module.exports = mongoose.model('Audit', s);
