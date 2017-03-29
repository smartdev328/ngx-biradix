'use strict';
var express = require('express');
var _ = require('lodash');
var packages = require('../package.json');
var OrgService = require('../api/organizations/services/organizationService')
var redisService = require('../api/utilities/services/redisService')
var error = require('../config/error')
var settings = require('../config/settings')
var jwt = require('jsonwebtoken');

function sendError(req,res) {
    var context = req.body.context || {}

    error.send(req.body.error, {ui_context: context, headers:req.headers, ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress, user: req.user});
    return res.status(200).json({success:true});
}

module.exports = (function() {

    var ui = express.Router();

    ui.get('/d/:id', function(req,res) {
        return res.redirect('/#/login?r=%2Fdashboard%3Fid=' + req.params.id + '%26s='+req.query.s);

    })

    ui.get('/u', function(req,res) {
        return res.redirect('/#/login?r=%2FupdateProfile%3Fnotifications=1');
    })
    ui.post('/error', function (req, res) {

        if (!req.cookies.token) {
            return sendError(req,res);
        }

        jwt.verify(req.cookies.token, settings.SECRET, function(err, decoded) {

            if (!decoded) {
                return sendError(req,res);
            }
            redisService.getByKey(decoded, function(err, result) {
                if (result) {
                    req.user = result;
                }
                sendError(req,res);
            });


        });
    });

    ui.get('/', function (req, res) {
        var phantom = req.headers['user-agent'].indexOf('PhantomJS') > -1;
        var local = (subdomain == 'localhost' || phantom);

        if (req.headers['x-forwarded-proto'] !== 'https'
            && !phantom
            && req.get('host').indexOf('biradix.com') > -1
            // && req.get('host').indexOf('dev.biradix.com') == -1
            // && req.get('host').indexOf('demo.biradix.com') == -1
            // && req.get('host').indexOf('qa.biradix.com') == -1
        ) {
            return res.redirect('https://' + req.get('host') + req.originalUrl);
        }

        var subdomain = req.hostname.split('.')[0].toLowerCase();

        OrgService.read(function(err, orgs) {

            var org = _.find(orgs, function(org) { return org.subdomain.toLowerCase() == subdomain})

            if (!org) {
                org = _.find(orgs, function(org) { return org.isDefault === true })
            }

            if (!org) {
                return res.status(200).send("No data");
            }

            res.render('index', {version: packages.version, logoBig: org.logoBig, logoSmall : org.logoSmall, local: local, phantom: phantom, dyno: process.env.DYNO
                //nreum : newrelic.getBrowserTimingHeader()
            });

        })

    })

    return ui;
})();