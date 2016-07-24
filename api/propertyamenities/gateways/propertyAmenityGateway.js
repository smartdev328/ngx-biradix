'use strict';
var AccessService =  require('../../access/services/accessService')
var PropertyAmenityService =  require('../services/PropertyAmenityService')
var express = require('express');
var routes = express.Router();

routes.get('/delete/:amenityid', function (req, res) {
    AccessService.canAccess(req.user,'Admin', function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        PropertyAmenityService.deleteAmenity(req.user,req.context,null, req.params.amenityid, function (err) {
            return res.status(200).json({errors: err});
        
        });
    })
});

module.exports = routes;
