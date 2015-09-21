var AccessService = require('../../access/services/accessService')
var DashboardService = require('../services/dashboardService')
var async = require("async")
var settings = require('../../../config/settings')
var queues = require('../../../config/queues')

module.exports = {
    init: function(Routes) {
        Routes.post('/:id/full', function (req, res) {

            var graphs = req.body.show.graphs;
            var profiles = [];
            req.body.show.graphs = true;
            req.body.show.selectedBedroom = -1;
            req.body.show.ner = true;
            req.body.show.occupancy = true;
            DashboardService.getDashboard(req.user,req.params.id, req.body, function(err,dashboard) {
                if (err) {
                    return res.status(400).send(err);
                }
                async.eachLimit(dashboard.comps, 10, function(comp, callbackp){
                    req.body.show.graphs = graphs;
                    req.body.show.traffic = true;
                    req.body.show.leases = true;
                    req.body.show.bedrooms = true;

                    DashboardService.getProfile(req,res, false, dashboard.property._id, comp._id, function(profile) {
                        profiles.push(profile)
                        callbackp();
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
            DashboardService.getProfile(req,res, true, req.params.id, req.params.id, function(o) {
                res.status(200).json({profile: o});
            })
        });

        Routes.post('/:id/dashboard', function (req, res) {

            queues.getExchange().publish({user: req.user,id:req.params.id, options:req.body},
                {
                    key: settings.DASHBOARD_QUEUE,
                    reply: function (data) {
                        if (data.err) {
                            return res.status(400).send(data.err);
                        }
                        res.status(200).json(data.dashboard);
                    }
                }
            );


        });
    }
}