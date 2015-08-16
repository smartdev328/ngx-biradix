var AccessService = require('../../access/services/accessService')
var DashboardService = require('../services/dashboardService')

module.exports = {
    init: function(Routes) {
        Routes.post('/:id/full', function (req, res) {

            var graphs = req.body.show.graphs;
            var profiles = [];
            req.body.show.graphs = true;
            req.body.show.selectedBedroom = -1;
            req.body.show.ner = true;
            req.body.show.occupancy = true;
            DashboardService.getDashboard(req,res, function(dashboard) {
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
                    res.status(200).json({dashboard: dashboard, profiles: profiles});
                });

            })

        });
        Routes.post('/:id/profile', function (req, res) {
            DashboardService.getProfile(req,res, true, req.params.id, req.params.id, function(o) {
                res.status(200).json({profile: o});
            })
        });

        Routes.post('/:id/dashboard', function (req, res) {

            DashboardService.getDashboard(req,res, function(o) {
                res.status(200).json(o);
            })

        });
    }
}