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
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require('fs')

module.exports = (function() {
    console.log(`Loading with ${settings.API_URL} as api endpoint`);
    let ui = new express.Router();

    ui.get("/serverVariables", (req, res) => {
        res.status(200).send({
          apiUrl: settings.API_URL,
          version: packages.version,
          raygun_key: settings.RAYGUN_APIKEY
        });
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
        const phantom = (req.headers["user-agent"] || "").indexOf("PhantomJS") > -1;
        const localhost = req.get("host").toString().toLowerCase().indexOf("localhost") > -1;

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
                v2: localhost ? "http://localhost:2003/v2/" : "/v2/"
            });
    });

  ui.get('/version.json', function (req, res) {
    const filePath = path.join(__dirname + '/../dist/biradix-platform/hash.json');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(200).send("");
    }
  });

  ui.get('/v2(/[A-Za-z0-9]+)?(/[A-Za-z0-9]+)?(/[A-Za-z0-9]+)?', function (req, res) {
    if (req.headers["x-forwarded-proto"] !== "https"
      && req.get("host").indexOf(".com") > -1
    ) {
      return res.redirect("https://" + req.get("host") + req.originalUrl);
    }


    res.sendFile(path.join(__dirname + '/../dist/biradix-platform/index.html'));
  });

    ui.get("/sso", function(req, res) {
      jwt.verify(req.query.token, settings.SECRET, function(err, decoded) {
        if (err) {
          res.redirect('/');
        } else {
          res.cookie('token', decoded.data);
          res.cookie('tokenDate', "");
          res.redirect('/#/login?r=' + encodeURIComponent(req.query.r) + "&t=");
        }
      });
   });

  ui.get("/oauth2/authorize", (req, res) => {
    let data = JSON.stringify(req.query);
    let buff = new Buffer(data);
    let base64data = buff.toString('base64');

    res.redirect('/#/sso?o=' + base64data);
  });
  
    return ui;
})();
