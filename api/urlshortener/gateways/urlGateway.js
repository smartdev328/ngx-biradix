'use strict';
var express = require('express');
var Routes = express.Router();
var redisService = require('../../utilities/services/redisService')
var md5 = require('md5');
/////////////////////////////////

Routes.post('/', function (req, res) {
    var response = "";

    if (req.body.url) {
        console.log('Date 1: ', new Date());
        var key = md5(req.body.url);
        console.log('Date 2: ', new Date());
        redisService.set(req.body.url,req.body.url,30);
        console.log('Date 3: ', new Date());
        return res.status(200).json({key: key});
    }
    else {
        return res.status(200).json({key: ""});
    }
});

module.exports = Routes;