'use strict';
var express = require('express');
var Routes = express.Router();
var HerokuService = require("../../utilities/services/herokuService");
var queueService = require('../../properties/services/queueService');
var propertyService = require('../../properties/services/propertyService');
var userService  = require('../../users/services/userService');

Routes.get('/restart', function (req, res) {
    HerokuService.restartAllDynos();

    return res.status(200).json({success: true});
});

Routes.get('/profile', function (req, res) {
    userService.getSystemUser(function(obj) {
        var SystemUser = obj.user;
        propertyService.search(SystemUser,{limit:1}, function(err,properties) {
            if (err) {
                throw new Error(err);
            }
            queueService.getProfile(SystemUser, {
                daterange: { daterange: "Today"},
                show: {}
            }, false, properties[0]._id,  properties[0]._id, function(err,o) {
                if (err) {
                    throw new Error(err);
                }

                res.status(200).send("OK");
                properties = null;
                SystemUser = null;
                obj = null;
                o = 0;
            });
        })

    })
    //queueService.getProfile(req.user, req.body, true, req.params.id, req.params.id, function(err,o) {
    //    if (err) {
    //        return res.status(400).send(err);
    //    }
    //    res.status(200).json({profile: o});
    //    o = null;
    //})
});


module.exports = Routes;