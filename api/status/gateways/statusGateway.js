'use strict';
var settings = require('../../../config/settings')
var bus = require('../../../config/queues')
var express = require('express');
var Routes = express.Router();
var HerokuService = require("../../utilities/services/herokuService");
var queueService = require('../../properties/services/queueService');
var propertyService = require('../../properties/services/propertyService');
var userService  = require('../../users/services/userService');
var propertySchema = require('../../properties/schemas/propertySchema');

Routes.get('/restart', function (req, res) {
    HerokuService.restartAllDynos();

    return res.status(200).json({success: true});
});

Routes.get('/rabbit', function (req, res) {
    bus.query(settings.WEB_STATUS_QUEUE,{test:true},
        function (data) {
            if (data.data.test !== true) {
                throw new Error("Rabbit result doesnt match");
            }
            res.status(200).send("OK");
        }
    );
});


Routes.get('/db', function (req, res) {
    propertySchema.findOne({}, function(err, obj) {
        if (err) {
            throw new Error(err);
        }
        obj = null;
        res.status(200).send("OK");
    })
});

Routes.get('/dashboard', function (req, res) {
    userService.getSystemUser(function (obj) {
        var SystemUser = obj.user;
        propertyService.search(SystemUser, {limit: 1, skipAmenities: true, active: true, hideCustom: true}, function (err, properties) {
            if (err) {
                throw new Error(err);
            }

            var options = {
                daterange: { daterange: "Today"},
                show: {}
            };
            var req = {user: SystemUser, params: {id: properties[0]._id}, body: options};

            queueService.getDashboard(req, function (err, o) {
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
})

Routes.get('/profile', function (req, res) {
    userService.getSystemUser(function(obj) {
        var SystemUser = obj.user;
        propertyService.search(SystemUser,{limit:1, skipAmenities: true, active: true, hideCustom: true}, function(err,properties) {
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