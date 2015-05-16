'use strict';

var express = require('express');
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var moment = require('moment')
var request = require('request')

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

Routes.get('/:id/excel', function (req, res) {
    PropertyService.search(req.user, {_id: req.params.id}, function(err, properties) {

        moment().utcOffset(req.query.timezone);

        var p = properties[0];
        var fileName = (p.name + "_").replace(/ /g, " ") + '_and_Comps_';

        fileName += moment().format("MM_DD_YYYY");

        fileName += ".xlsx";

        request('http://biradixsheets.apphb.com/').pipe(res)

    })


});

module.exports = Routes;