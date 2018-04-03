const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const s = new Schema({
    name: {
        type: String,
    },
    subdomain: {
        type: String,
    },
    logoBig: {
        type: String,
    },
    logoSmall: {
        type: String,
    },
    isDefault: Boolean,
    settings: {},
});

module.exports = mongoose.model("Organization", s);
