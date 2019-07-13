"use strict";
const express = require("express");
const packages = require("../package.json");
const settings = require("../config/settings");
const request = require("request");
const querystring = require("querystring");
const vendorsjshash = require("../dist/vendorsjs-hash.json");
const vendorscsshash = require("../dist/vendorscss-hash.json");
const globaljshash = require("../dist/globaljs-hash.json");
const globalcsshash = require("../dist/globalcss-hash.json");

module.exports = (function() {
    console.log(`Loading with ${settings.API_URL} as api endpoint`);
    let ui = new express.Router();

    ui.get("/test", (req, res) => {
        res.status(200).send("Host: " + JSON.stringify(req.headers));
    });

    ui.get("/robots.txt", (req, res) => {
        res.status(200).send("User-agent: *\n" +
            "Disallow: /");
    });

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

    ui.get('/p/:token', function (req, res) {
        res.redirect('/#/password/reset/' + req.params.token);
    })

    ui.get('/g/:propertyid/:token', function (req, res) {
        jwt.verify(req.params.token, settings.SECRET, function(err, decoded) {
            if (err) {
                res.redirect('/#/expired');
            } else {
                res.cookie('token', req.params.token);
                res.cookie('tokenDate', "");
                res.redirect('/#/dashboard2?id=' + req.params.propertyid)
            }
        });
    })

    ui.get("/", function(req, res) {
        req.headers = req.headers || {"user-agent": ""};
        let phantom = (req.headers["user-agent"] || "").indexOf("PhantomJS") > -1;

        if (req.headers["x-forwarded-proto"] !== "https"
            && !phantom
            && req.get("host").indexOf("biradix.com") > -1
        ) {
            return res.redirect("https://" + req.get("host") + req.originalUrl);
        }

            let hashes = {
                vendorsjs: vendorsjshash["vendors.js"],
                vendorscss: vendorscsshash["vendors.css"],
                globaljs: globaljshash["global.js"],
                globalcss: globalcsshash["global.css"],
            };

            res.render("index", {hashes: hashes,
                version: packages.version,
                phantom: phantom,
                maintenance: settings.MAINTENANCE_MODE,
                raygun_key: settings.RAYGUN_APIKEY,
                heroku_env: settings.NEW_RELIC_NAME,
                api: settings.API_URL,
            });
    });

    ui.get("/sso", function(req, res) {
        res.redirect('/#/login?r=' + encodeURIComponent(req.query.r) + "&t=" + encodeURIComponent(req.query.token));
   });

    return ui;
})();
