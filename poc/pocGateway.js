'use strict';

var express = require('express');
var _ = require('lodash');
var routes = express.Router();
var async = require("async");
var request = require('request')
var OrgService = require('../api/organizations/services/organizationService')
var PropertyService = require('../api/properties/services/propertyService')
var AmenityService = require('../api/amenities/services/amenityService')

routes.get('/import', function(req, res) {

    async.parallel({
        props: function(callbackp) {
            request('http://platform.biradix.com/seed/props?secret=alex', function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    var props = JSON.parse(body)
                    callbackp(null,props)
                } else {
                    callbackp(error, null);
                }
            })
        },
        orgs: function(callbackp) {
            OrgService.read(function (err, orgs) {
                callbackp(null, orgs)
            });
        },
        links: function(callbackp) {
            request('http://platform.biradix.com/seed/comps?secret=alex', function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    var links = JSON.parse(body)
                    callbackp(null,links)
                } else {
                    callbackp(error, null);
                }
            })
        },
        surveys: function(callbackp) {
            request('http://platform.biradix.com/seed/surveys?secret=alex', function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    var surveys = JSON.parse(body)
                    callbackp(null,surveys)
                } else {
                    callbackp(error, null);
                }
            })
        },
        amenities: function(callbackp) {
            var time = new Date();
            AmenityService.search(function (err, amenities) {
                callbackp(err, amenities)
            })
        }
    },function(err, all) {
        all.props.forEach(function(p) {
            if (p.company != 'platform') {
                p.orgid = _.find(all.orgs, function (o) {
                    return o.subdomain == p.company
                })._id;
            }
        })

        async.eachLimit(all.props, 20, function(prop, callbackp){
            console.log(prop.name);
            PropertyService.create(prop, function (err, newprop) {
                prop._id = newprop._id;
                callbackp(err, newprop)
            });
        }, function(err) {

            async.eachLimit(all.links, 20, function(link, callbackp){
                var subj = _.find(all.props, function(p) {return p.id.toString() == link.subj.toString()});
                if (!subj) {
                    throw Error("Unable to find link subject: " + link.subj.toString())
                }
                var comp = _.find(all.props, function(p) {return p.id.toString() == link.comp.toString()});
                if (!comp) {
                    throw Error("Unable to find link subject: " + link.comp.toString())
                }
                PropertyService.linkComp(subj._id, comp._id, function(err, newprop) {
                    callbackp(err, newprop)
                })
            }, function(err) {

                async.eachLimit(all.surveys, 20, function(survey, callbackp){
                    survey.date = new Date(parseInt(survey.date.match(/([0-9])+/g)[0]))
                    survey.community_amenities = _.pluck(_.filter(all.amenities, function(am) { return survey.community_amenities.indexOf(am.name) > -1}),"_id")

                    survey.floorplans.forEach(function(fp) {
                        fp.amenities = _.pluck(_.filter(all.amenities, function(am) { return fp.amenities.indexOf(am.name) > -1}),"_id")
                    })
                    var subj = _.find(all.props, function(p) {return p.id.toString() == survey.propertyid});
                    if (!subj) {
                        throw Error("Unable to find link subject: " + link.subj.toString())
                    }
                    PropertyService.createSurvey(subj._id, survey, function(err, newsurvey) {
                        callbackp(err, newsurvey)
                    })
                }, function(err) {

                    res.status(200).send('Done');
                });
            });
        });


    });


})

routes.get('/readXls', function (req, res) {


    var XLS = require('xlsjs');

    var path = __dirname + '/../site/poc/01. Beach House Market Survey 10-30-13.xls';
    console.log(path);

    var workbook = XLS.readFile(path);

    var sheet_name_list = workbook.SheetNames;
    console.log(sheet_name_list);
    var Address = workbook.Sheets[sheet_name_list[0]]['D9'].v;

    res.status(200).send('Address (Cell D9): ' + Address);
})

routes.get('/pdf', function(req, res) {
    var phantom = require('phantom-render-stream');


    var render = phantom({
        pool        : 5,           // Change the pool size. Defaults to 1
        timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
        format      : 'pdf',      // The default output format. Defaults to png
        quality     : 100,        // The default image quality. Defaults to 100. Only relevant for jpeg format.
        userAgent   : req.headers['user-agent']
    });

    var url = req.protocol + '://' + req.get('host') + "/#/dashboard";
    console.log(url);

    res.setHeader("content-type", "application/pdf");
    res.setHeader('Content-Disposition', 'attachment; filename=google.pdf');
    render(url).pipe(res);




})

routes.get('/pdf/google', function(req, res) {
    var phantom = require('phantom-render-stream');


    var render = phantom({
        pool        : 5,           // Change the pool size. Defaults to 1
        timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
        format      : 'pdf',      // The default output format. Defaults to png
        quality     : 100,        // The default image quality. Defaults to 100. Only relevant for jpeg format.
        userAgent   : req.headers['user-agent']
    });

    var url = "http://www.google.com";
    console.log(url);

    res.setHeader("content-type", "application/pdf");
    res.setHeader('Content-Disposition', 'attachment; filename=google.pdf');
    render(url).pipe(res);




})
module.exports = routes;

//var render = phantom({
//    pool        : 5,           // Change the pool size. Defaults to 1
//    timeout     : 1000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
//    tmp         : '/tmp',      // Set the tmp where tmp data is stored when communicating with the phantom process.
//                               //   Defaults to /tmp if it exists, or os.tmpDir()
//    format      : 'jpeg',      // The default output format. Defaults to png
//    quality     : 100,         // The default image quality. Defaults to 100. Only relevant for jpeg format.
//    width       : 1280,        // Changes the width size. Defaults to 1280
//    height      : 800,         // Changes the height size. Defaults to 960
//    paperFormat : 'A4',        // Defaults to A4. Also supported: 'A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'.
//    orientation : 'portrait',  // Defaults to portrait. 'landscape' is also valid
//    margin      : '0cm',       // Defaults to 0cm. Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'.
//    userAgent   : '',          // No default.
//    headers     : {Foo:'bar'}, // Additional headers to send with each upstream HTTP request
//    paperSize:  : null,        // Defaults to the paper format, orientation, and margin.
//    crop        : false,       // Defaults to false. Set to true or {top:5, left:5} to add margin
//    printMedia  : false,       // Defaults to false. Force the use of a print stylesheet.
//    maxErrors   : 3,           // Number errors phantom process is allowed to throw before killing it. Defaults to 3.
//    expects     : 'something', // No default. Do not render until window.renderable is set to 'something'
//    retries     : 1,           // How many times to try a render before giving up. Defaults to 1.
//    phantomFlags: ['--ignore-ssl-errors=true'] // Defaults to []. Command line flags passed to phantomjs
//maxRenders  : 20,          // How many renders can a phantom process make before being restarted. Defaults to 20
//
//    injectJs    : ['./includes/my-polyfill.js'] // Array of paths to polyfill components or external scripts that will be injected when the page is initialized
//});