'use strict';
var express = require('express');
var packages = require('../package.json');

module.exports = (function() {

    var ui = express.Router();

    ui.get('/', function (req, res) {
        res.render('index', {version: packages.version});
    })

    return ui;
})();