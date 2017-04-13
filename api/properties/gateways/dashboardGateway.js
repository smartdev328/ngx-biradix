var AccessService = require('../../access/services/accessService')
var async = require("async")
var queueService = require('../services/queueService');
var _ = require("lodash")
module.exports = {
    init: function(Routes) {
        Routes.post('/notifications_test', function (req, res) {
            queueService.sendNotification(req.user, {properties: req.body.properties, showLeases: req.body.showLeases}, function() {})
            res.status(200).json({success:true});
        })

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

