"use strict";
const express = require("express");
const _ = require("lodash");
const packages = require("../package.json");
const OrgService = require("../api/organizations/services/organizationService");
const settings = require("../config/settings");
const request = require("request");
const querystring = require("querystring");
const vendorsjshash = require("../dist/vendorsjs-hash.json");
const vendorscsshash = require("../dist/vendorscss-hash.json");
const globaljshash = require("../dist/globaljs-hash.json");
const globalcsshash = require("../dist/globalcss-hash.json");

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

     ui.get("/", function(req, res) {
        req.headers = req.headers || {"user-agent": ""};
        let phantom = (req.headers["user-agent"] || "").indexOf("PhantomJS") > -1;
        let subdomain = req.hostname.split(".")[0].toLowerCase();
        let local = (subdomain == "localhost" || phantom);

        if (req.headers["x-forwarded-proto"] !== "https"
            && !phantom
            && req.get("host").indexOf("biradix.com") > -1
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
                raygun_key: settings.RAYGUN_APIKEY,
                // nreum : newrelic.getBrowserTimingHeader()
            });
        });
    });

    return ui;
})();
