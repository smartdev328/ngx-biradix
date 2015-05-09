'use strict';
var express = require('express');
var packages = require('../package.json');

module.exports = (function() {

    var ui = express.Router();

    ui.get('/', function (req, res) {
        var subdomain = req.hostname.split('.')[0].toLocaleLowerCase();
        var logoBig = 'wood.png'
        var logoSmall = 'wood-small.png'
        res.render('index', {version: packages.version, logoBig: logoBig, logoSmall : logoSmall});
    })

    return ui;
})();