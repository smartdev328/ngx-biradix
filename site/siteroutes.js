"use strict";
const express = require("express");
const _ = require("lodash");
const packages = require("../package.json");
const OrgService = require("../api/organizations/services/organizationService");
const redisService = require("../api/utilities/services/redisService");
const error = require("../config/error");
const settings = require("../config/settings");
const jwt = require("jsonwebtoken");
const request = require("request");
const querystring = require("querystring");
const vendorsjshash = require("../dist/vendorsjs-hash.json");
const vendorscsshash = require("../dist/vendorscss-hash.json");
const globaljshash = require("../dist/globaljs-hash.json");
const globalcsshash = require("../dist/globalcss-hash.json");

/**
 * Sends Error.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @return {object} Returns success.
 */
function sendError(req, res) {
    let context = req.body.context || {};

    error.send(req.body.error, {ui_context: context, headers: req.headers, ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress, user: req.user});
    return res.status(200).json({success: true});
}

module.exports = (function() {
    let ui = new express.Router();

    ui.get("/i", function(req, res) {
        var url = "https://maps.googleapis.com/maps/api/staticmap?" + querystring.stringify(req.query);
        request.get(url).pipe(res);
    });

    ui.get("/d/:id", function(req, res) {
        return res.redirect("/#/login?r=%2Fdashboard%3Fid=" + req.params.id + "%26s="+req.query.s);
    });

    ui.get("/u", function(req, res) {
        return res.redirect("/#/login?r=%2FupdateProfile%3Fnotifications=1");
    });

    ui.post("/error", function(req, res) {
        if (!req.cookies.token) {
            return sendError(req, res);
        }

        jwt.verify(req.cookies.token, settings.SECRET, function(err, decoded) {
            if (!decoded) {
                return sendError(req, res);
            }
            redisService.getByKey(decoded.data, function(err, result) {
                if (result) {
                    req.user = result;
                }
                sendError(req, res);
            });
        });
    });

    ui.get("/", function(req, res) {
        req.headers = req.headers || {};
        let phantom = req.headers["user-agent"].indexOf("PhantomJS") > -1;
        let subdomain = req.hostname.split(".")[0].toLowerCase();
        let local = (subdomain == "localhost" || phantom);

        if (req.headers["x-forwarded-proto"] !== "https"
            && !phantom
            && req.get("host").indexOf("biradix.com") > -1
            // && req.get("host").indexOf("dev.biradix.com") == -1
            // && req.get("host").indexOf("demo.biradix.com") == -1
            // && req.get("host").indexOf("qa.biradix.com") == -1
        ) {
            return res.redirect("https://" + req.get("host") + req.originalUrl);
        }

        OrgService.read(function(err, orgs) {
            let org = _.find(orgs, function(org) {
                return org.subdomain.toLowerCase() == subdomain;
            });

            if (!org) {
                org = _.find(orgs, function(org) {
                    return org.isDefault === true;
                });
            }

            if (!org) {
                return res.status(200).send("No data");
            }

            let hashes = {
                vendorsjs: vendorsjshash["vendors.js"],
                vendorscss: vendorscsshash["vendors.css"],
                globaljs: globaljshash["global.js"],
                globalcss: globalcsshash["global.css"],
            };

            res.render("index", {hashes: hashes,
                version: packages.version,
                logoBig: org.logoBig,
                logoSmall: org.logoSmall, local: local,
                phantom: phantom,
                dyno: process.env.DYNO,
                maintenance: settings.MAINTENANCE_MODE,
                // nreum : newrelic.getBrowserTimingHeader()
            });
        });
    });

    return ui;
})();
