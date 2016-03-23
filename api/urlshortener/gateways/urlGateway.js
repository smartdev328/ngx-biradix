'use strict';
var express = require('express');
var Routes = express.Router();
var redisService = require('../../utilities/services/redisService')
var md5 = require('MD5');
/////////////////////////////////

Routes.get('/:key', function (req, res) {
    var response = "";

    redisService.getByKey(req.params.key, function(err, result) {
        if (!result) {
            return res.status(200).send("Invalid Url");
        } else {
            res.redirect(result);
        }
    });
});

Routes.post('/', function (req, res) {
    var response = "";

    if (req.body.url) {
        var key = md5(req.body.url);

        redisService.set(req.body.url,req.body.url,30);

        return res.status(200).json({url: "/url/" + key});
    }
    else {
        return res.status(200).json({url: response});
    }
});

module.exports = Routes;