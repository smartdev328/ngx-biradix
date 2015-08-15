'use strict';

var express = require('express');
var AmenitiesService = require('../services/amenityService')
var AccessService = require('../../access/services/accessService')
var Routes = express.Router();
var async = require('async')
var _ = require('lodash')


Routes.put('/', function (req, res) {
    var amenity = req.body;

    AmenitiesService.create(req.user, req.context, amenity, function(err, amenity) {
        return res.status(200).json({errors:err, amenity: amenity});
    })

});

module.exports = Routes;
