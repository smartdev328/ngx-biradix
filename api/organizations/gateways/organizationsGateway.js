'use strict';

var express = require('express');
var organizationService = require('../services/organizationService')
var AccessService = require('../../access/services/accessService')
var Routes = express.Router();


Routes.post('/', function (req, res) {
    var amenity = req.body;

    AccessService.canAccess(req.user,"Admin", function(canAccess) {

        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        organizationService.read(function (err, orgs) {
            return res.status(200).json({errors: err, organizations: orgs});
        })
    });
});

Routes.put('/:id/defaultSettings', function (req, res) {

    AccessService.canAccess(req.user,"Admin", function(canAccess) {

        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        organizationService.defaultSettings(req.user, req.context, req.params.id, req.body,function (err, orgs) {
            res.status(200).json({errors: err});
        })
    });
});

module.exports = Routes;
