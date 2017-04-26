'use strict';
var queues = require("../config/queues")
var express = require('express');
var _ = require('lodash');
var routes = express.Router();
var async = require("async");
var request = require('request')
var PropertyService = require('../api/properties/services/propertyService')
var AccessService = require('../api/access/services/accessService')
var PropertySchema = require('../api/properties/schemas/propertySchema')
var settings = require("../config/settings")
var OrgService = require('../api/organizations/services/organizationService')
var userService = require('../api/users/services/userService')
var EmailService = require('../api/business/services/emailService')

routes.post('/gitWebHook', function(req, res) {
    if (req.body.deployment_status && req.body.deployment_status.state == 'success' && req.body.deployment && req.body.deployment.environment && req.body.deployment.environment.indexOf('biradixplatform-qa-pr') > -1) {
        var url = "https://" + req.body.deployment.environment + ".herokuapp.com";
        var sha = req.body.deployment.sha;

        var ghostInspector = "https://api.ghostinspector.com/v1/suites/58d891f966fd7359f7af2aa4/execute/?apiKey=07cd183a6be0326686341494aaa63ca12218de05&startUrl=" + url;

        //Call Test(s) after 1 minute
        setTimeout(function() {
            request({url: ghostInspector, timeout: 1000 * 60 * 60}, function (error, response, body) {
                var resp;
                try {
                    resp = JSON.parse(response.body)
                } catch (ex) {
                    resp = null;
                }

                var status, description;
                if (!resp) {
                    status = "error"
                    description = "Error Calling Ghost Inspector"
                }
                else
                if (resp.code == "SUCCESS") {
                    status = "success"
                    description = "Ghost Inspector Passed"
                }
                else {
                    status = "failure"
                    description = "Ghost Inspector Failed"
                }
                GitHubStatus(sha,status,description);

            });
        }, 60000)

    }

     res.status(200).json({success:true});
});

function GitHubStatus(sha, state, description) {
    request(
        {
            method: "POST",
            json: true,
            url : "https://api.github.com/repos/EugenePerson/biradix-platform/statuses/" + sha,
            headers : {
                "User-Agent": "BiRadix CI",
                "Content-Type": "application/json",
                "Authorization" : "Basic " + new Buffer("EugenePerson" + ":" + process.env.GITHUB_PERSONAL_KEY).toString("base64")
            },
            body:
                {
                    "state": state,
                    "description": description,
                    "context": "continuous-integration/biradix"
                }

        },
        function (error, response, body) {

        }
    );

}

// routes.get('/hydrateOrgRoles', function(req,res) {
//     OrgService.hydrateOrgRoles();
//     return res.status(200).json({done:true});
// })

// routes.get('/viewall', function(req, res) {
//
//     AccessService.getRoles({tags: ['CM', 'RM', 'BM'], cache: false}, function(err, roles) {
//
//         var permissions = [];
//         roles.forEach(function(r) {
//             permissions.push({executorid: r._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'})
//         })
//
//         async.eachLimit(permissions, 10, function(permission, callbackp){
//             AccessService.createPermission(permission, function (err, perm) {
//                 callbackp(err, perm)
//             });
//         }, function(err) {
//             return res.status(200).json(permissions);
//         });
//
//
//     });
// });

routes.get('/addorg', function(req, res) {
    var name = req.query.name;
    var subdomain = req.query.subdomain;

    if (!name || !subdomain) {
        return res.status(200).send("Error, syntax: ?name=My%20Org&subdomain=myorg");
    }

    var org = {name: name, subdomain: subdomain, logoBig: subdomain + '.png', logoSmall: subdomain + '-small.png'}

    OrgService.read(function(err, orgs) {
        if (_.find(orgs, function(x) {return x.subdomain == org.subdomain || x.name == org.name})) {
            return res.status(200).send("Duplicate");
        }

        PropertySchema.find({},function(err, props) {
            OrgService.create(org, function (err, newOrg) {
                if (err) {
                    return res.status(200).send(err);
                }
                org = newOrg;

                var CM = {name: "Corporate Manager", tags: ['CM'], orgid: org._id}
                var RM = {name: "Regional Manager", tags: ['RM'], orgid: org._id}
                var BM = {name: "Business Manager", tags: ['BM'], orgid: org._id}
                var PO = {name: "Property Owner", tags: ['PO'], orgid: org._id}

                async.parallel({
                    CM: function (callbackp) {
                        AccessService.createRole(CM, function (err, role) {
                            role = JSON.parse(JSON.stringify(role));
                            role.org = org;
                            callbackp(null, role)
                        });
                    },
                    RM: function (callbackp) {
                        AccessService.createRole(RM, function (err, role) {
                            role = JSON.parse(JSON.stringify(role));
                            role.org = org;
                            callbackp(null, role)
                        });
                    },
                    BM: function (callbackp) {
                        AccessService.createRole(BM, function (err, role) {
                            role = JSON.parse(JSON.stringify(role));
                            role.org = org;
                            callbackp(null, role)
                        });
                    },
                    PO: function (callbackp) {
                        AccessService.createRole(PO, function (err, role) {
                            role = JSON.parse(JSON.stringify(role));
                            role.org = org;

                            callbackp(null, role)
                        });
                    },
                    Guest : function(callbackp) {
                        AccessService.getOrgRoles({tags: ['Guest'], cache: false}, function (err, roles) {

                           callbackp(null,roles[0])
                        })
                    }

                }, function (err, roles) {

                    AccessService.upsertOrgRole_read(roles.CM,function() {});
                    AccessService.upsertOrgRole_read(roles.RM,function() {});
                    AccessService.upsertOrgRole_read(roles.BM,function() {});
                    AccessService.upsertOrgRole_read(roles.PO,function() {});


                    var permissions = [
                        {executorid: roles.CM._id, resource: "Users", allow: true, type: 'Execute'},
                        {executorid: roles.RM._id, resource: "Users", allow: true, type: 'Execute'},
                        {executorid: roles.BM._id, resource: "Users", allow: true, type: 'Execute'},
                        {executorid: roles.CM._id, resource: "History", allow: true, type: 'Execute'},
                        {executorid: roles.RM._id, resource: "History", allow: true, type: 'Execute'},
                        {executorid: roles.BM._id, resource: "History", allow: true, type: 'Execute'},
                        {executorid: roles.CM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
                        {executorid: roles.RM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
                        {executorid: roles.BM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
                        {executorid: roles.CM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
                        {executorid: roles.RM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
                        {executorid: roles.CM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
                        {executorid: roles.CM._id, resource: "Properties", allow: true, type: 'Execute'},
                        {executorid: roles.RM._id, resource: "Properties", allow: true, type: 'Execute'},
                        {executorid: roles.BM._id, resource: "Properties", allow: true, type: 'Execute'},
                        {executorid: roles.CM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
                        {executorid: roles.RM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},
                        {executorid: roles.BM._id, resource: "Properties/ViewAll", allow: true, type: 'Execute'},

                        {executorid: roles.CM._id, resource: roles.CM._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.CM._id, resource: roles.RM._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.CM._id, resource: roles.BM._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.CM._id, resource: roles.PO._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.CM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},

                        {executorid: roles.RM._id, resource: roles.RM._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.RM._id, resource: roles.BM._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.RM._id, resource: roles.PO._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.RM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},

                        {executorid: roles.BM._id, resource: roles.BM._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.BM._id, resource: roles.PO._id.toString(), allow: true, type: 'RoleAssign'},
                        {executorid: roles.BM._id, resource: roles.Guest._id.toString(), allow: true, type: 'RoleAssign'},

                        {executorid: roles.PO._id, resource: roles.PO._id.toString(), allow: true, type: 'RoleAssign'},
                    ];

                    props.forEach(function(prop) {
                        permissions.push({executorid: roles.CM._id, resource: prop._id.toString(), allow: true, type: 'PropertyView'})
                        permissions.push({executorid: roles.BM._id, resource: prop._id.toString(), allow: true, type: 'PropertyView'})
                        permissions.push({executorid: roles.RM._id, resource: prop._id.toString(), allow: true, type: 'PropertyView'})
                    })

                    async.eachLimit(permissions, 10, function (permission, callbackp) {
                        AccessService.createPermission(permission, function (err, perm) {
                            callbackp(err, perm)
                        });
                    }, function (err) {
                        res.status(200).send("OK");
                    });


                })


            });
        });


    }) ;

});

//routes.get('/fixPOs', function (req, res) {
//
//    AccessService.getRoles({tags:['PO_GROUP']}, function(err,roles) {
//        PropertySchema.find({},function(err, props) {
//            var data = [];
//            props.forEach(function(prop) {
//                var comps = _.pluck(prop.comps,"id");
//
//                comps.forEach(function(c) {
//                      var r = _.find(roles, function(x) { return x.tags.indexOf(prop._id.toString()) > -1 })._id.toString();
//                      data.push({n: prop.name, s:prop._id.toString(), comp: c.toString(), role: r});
//                })
//            })
//
//            var ObjectId = require('mongoose').Types.ObjectId;
//
//            async.eachLimit(data, 10, function(d, callbackp){
//
//                AccessService.createPermission({
//                    executorid: new ObjectId(d.role),
//                    resource: new ObjectId(d.comp),
//                    allow: true,
//                    type: 'PropertyView'
//                }, function () {
//                    callbackp(null);
//                });
//            }, function(err) {
//                res.status(200).json(data);
//            });
//
//        });
//    });
//
//
//});
//
//routes.get('/readXls', function (req, res) {
//
//
//    var XLS = require('xlsjs');
//
//    var path = __dirname + '/../site/poc/01. Beach House Market Survey 10-30-13.xls';
//    console.log(path);
//
//    var workbook = XLS.readFile(path);
//
//    var sheet_name_list = workbook.SheetNames;
//    console.log(sheet_name_list);
//    var Address = workbook.Sheets[sheet_name_list[0]]['D9'].v;
//
//    res.status(200).send('Address (Cell D9): ' + Address);
//})
//
//routes.get('/pdf', function(req, res) {
//    var phantom = require('phantom-render-stream');
//
//
//    var render = phantom({
//        pool        : 5,           // Change the pool size. Defaults to 1
//        timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
//        format      : 'pdf',      // The default output format. Defaults to png
//        quality     : 100,        // The default image quality. Defaults to 100. Only relevant for jpeg format.
//        userAgent   : req.headers['user-agent']
//    });
//
//    var url = req.protocol + '://' + req.get('host') + "/#/dashboard";
//    console.log(url);
//
//    res.setHeader("content-type", "application/pdf");
//    res.setHeader('Content-Disposition', 'attachment; filename=google.pdf');
//    render(url).pipe(res);
//
//
//
//
//})
//
//routes.get('/pdf/google', function(req, res) {
//    var phantom = require('phantom-render-stream');
//
//
//    var render = phantom({
//        pool        : 5,           // Change the pool size. Defaults to 1
//        timeout     : 30000,        // Set a render timeout in milliseconds. Defaults to 30 seconds.
//        format      : 'pdf',      // The default output format. Defaults to png
//        quality     : 100,        // The default image quality. Defaults to 100. Only relevant for jpeg format.
//        userAgent   : req.headers['user-agent']
//    });
//
//    var url = "http://www.google.com";
//    console.log(url);
//
//    res.setHeader("content-type", "application/pdf");
//    res.setHeader('Content-Disposition', 'attachment; filename=google.pdf');
//    render(url).pipe(res);
//
//
//
//
//})
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