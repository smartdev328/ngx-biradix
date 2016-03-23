'use strict';
var express = require('express');
var Routes = express.Router();
var redisService = require('../../utilities/services/redisService')
var md5 = require('MD5');
/////////////////////////////////

Routes.post('/', function (req, res) {
    var response = "";

    if (req.body.url) {
        var key = md5(req.body.url);

        redisService.set(req.body.url,req.body.url,30);

        return res.status(200).json({key: key});
    }
    else {
        return res.status(200).json({key: ""});
    }
});

module.exports = Routes;