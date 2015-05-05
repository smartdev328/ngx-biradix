'use strict';
var express = require('express');
var packages = require('../package.json');

module.exports = (function() {

    var ui = express.Router();

    ui.get('/', function (req, res) {
        var subdomain = req.hostname.split('.')[0].toLocaleLowerCase();
        var logo = 'biradix'
        console.log(subdomain)
        res.render('index', {version: packages.version, logo: logo});
    })

    return ui;
})();