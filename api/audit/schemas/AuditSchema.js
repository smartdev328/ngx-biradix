'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var s = new Schema({
    operator: {
        id : Schema.Types.ObjectId,
        name: String
    },
    user: {
        id : Schema.Types.ObjectId,
        name: String
    },
    property: {
        id : Schema.Types.ObjectId,
        name: String
    },
    amenity: {
        id : Schema.Types.ObjectId,
        name: String
    },
    type : String,
    description: String,
    date: {type: Date, index:true},
    context: {
        ip: String,
        user_agent: String
    },
    reverted : Boolean,
    revertedFromId : Schema.Types.ObjectId,
    data : Object
});

module.exports = mongoose.model('Audit', s);
