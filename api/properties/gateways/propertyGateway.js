'use strict';

var express = require('express');
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')


var Routes = express.Router();

Routes.post('/', function (req, res) {
    PropertyService.search(req.user, req.body, function(err, properties) {

        if (err) {
            res.status(400).send(err)
        } else {
            res.status(200).json({properties: properties})
        }

    })

});

module.exports = Routes;