'use strict';

var Liquid = require("liquid-node")
var engine = new Liquid.Engine

module.exports = {
    parse: function (template, values, filters, callback) {
        if (filters) {
            engine.registerFilters(filters);
        }

        engine
            .parseAndRender(template, values )
            .nodeify(function(err, result) {
                if (err) {
                    callback("PARSE ERROR: " + err);
                } else {
                    callback(result);
                }
            });
    }
}
