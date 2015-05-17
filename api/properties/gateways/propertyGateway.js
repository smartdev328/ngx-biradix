'use strict';

var express = require('express');
var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var ProgressService = require('../../progress/services/progressService')
var UserService = require('../../users/services/userService')
var moment = require('moment')
var request = require('request')
var phantom = require('phantom-render-stream');

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
        var fileName = p.name.replace(/ /g, "_") + '_and_Comps_';

        fileName += moment().format("MM_DD_YYYY");

        fileName += ".xlsx";

        var r = request.post('http://biradixsheets.apphb.com/excel', {
            form: {
                fileName : fileName,
                name: p.name

            }
        }).pipe(res)

        r.on('finish', function () {
            if (req.query.progressId) {
                ProgressService.setComplete(req.query.progressId)
            }
        })


    })


});

Routes.get('/:id/pdf', function (req, res) {
    PropertyService.search(req.user, {_id: req.params.id}, function(err, properties) {
        UserService.getFullUser(req.user, function(full) {
            moment().utcOffset(req.query.timezone);

            var p = properties[0];
            var fileName = p.name.replace(/ /g, "_") + '_and_Comps_';

            fileName += moment().format("MM_DD_YYYY");

            fileName += ".pdf";

            var render = phantom({
                pool        : 5,           // Change the pool size. Defaults to 1
                timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
                format      : 'pdf',      // The default output format. Defaults to png
                quality     : 100,        // The default image quality. Defaults to 100. Only relevant for jpeg format.
            });

            var url = req.protocol + '://' + req.get('host') + "/#/profile/" + p._id;

            var cookies = [{
                'name'     : 'token',   /* required property */
                'value'    : full.token,  /* required property */
                'domain'   : req.hostname,
                'path'     : '/',                /* required property */
                'httponly' : false,
                'secure'   : false,
                'expires'  : (new Date()).getTime() + (1000 * 60 * 60)   /* <-- expires in 1 hour */
            }];

            //console.log('Pdf: ' + url);
            //console.log(cookies);

            res.setHeader("content-type", "application/pdf");
            res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
            var r = render(url, {
                cookies: cookies
            }).pipe(res);

            r.on('finish', function () {
                if (req.query.progressId) {
                    ProgressService.setComplete(req.query.progressId)
                }
            })
        });




    })

});
module.exports = Routes;