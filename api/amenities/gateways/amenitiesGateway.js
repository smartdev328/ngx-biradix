'use strict';

var express = require('express');
var AmenitiesService = require('../services/amenityService')
var AccessService = require('../../access/services/accessService')
var Routes = express.Router();
var async = require('async')
var _ = require('lodash')

Routes.post('/', function (req, res) {
    AmenitiesService.search(req.body, function(err, amenities) {
        return res.status(200).json({amenities: amenities});
    })

});

Routes.put('/update', function (req, res) {
    var amenity = req.body;

    AccessService.canAccess(req.user,"Admin", function(canAccess) {

        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        AmenitiesService.update(req.user, req.context, amenity, function (err, amenity) {
            return res.status(200).json({errors: err, amenity: amenity});
        })
    });

});

Routes.put('/updateAliases', function (req, res) {
    var amenity = req.body;

    AccessService.canAccess(req.user,"Admin", function(canAccess) {

        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }
        
        AmenitiesService.updateAliases(req.user, req.context, amenity, function (err, amenity) {
            return res.status(200).json({errors: err, amenity: amenity});
        })
    });

});

Routes.put('/', function (req, res) {
    var amenity = req.body;

    AmenitiesService.create(req.user, req.context, amenity, function(err, amenity) {
        return res.status(200).json({errors:err, amenity: amenity});
    })

});

module.exports = Routes;
