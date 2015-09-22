var AccessService = require('../../access/services/accessService')
var async = require("async")
var queueService = require('../services/queueService');

module.exports = {
    init: function(Routes) {
        Routes.post('/:id/full', function (req, res) {

            var graphs = req.body.show.graphs;
            var profiles = [];
            req.body.show.graphs = true;
            req.body.show.selectedBedroom = -1;
            req.body.show.ner = true;
            req.body.show.occupancy = true;

            queueService.getDashboard(req, function(err,dashboard) {
                if (err) {
                    return res.status(400).send(err);
                }
                async.eachLimit(dashboard.comps, 10, function(comp, callbackp){
                    req.body.show.graphs = graphs;
                    req.body.show.traffic = true;
                    req.body.show.leases = true;
                    req.body.show.bedrooms = true;

                    queueService.getProfile(req.user,req.body, false, dashboard.property._id, comp._id, function(err,profile) {
                        profiles.push(profile)
                        callbackp(err);
                    })
                }, function(err) {
                    if (err) {
                        return res.status(400).send(err);
                    }
                    res.status(200).json({dashboard: dashboard, profiles: profiles});
                    dashboard = null;
                    profiles = null;
                });

            })

        });
        Routes.post('/:id/profile', function (req, res) {
            queueService.getProfile(req.user, req.body, true, req.params.id, req.params.id, function(err,o) {
                if (err) {
                    return res.status(400).send(err);
                }
                res.status(200).json({profile: o});
                o = null;
            })
        });

        Routes.post('/:id/dashboard', function (req, res) {

            queueService.getDashboard(req, function(err, dashboard) {
                if (err) {
                    return res.status(400).send(err);
                }
                res.status(200).json(dashboard);
                dashboard = null;
            })


        });
    }
}

