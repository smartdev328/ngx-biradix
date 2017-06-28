var AccessService = require('../../access/services/accessService')
var PropertyService = require('../services/propertyService')
var CompService = require('../services/compsService')
var _ = require("lodash");
var async = require("async");

module.exports = {
    init: function(Routes) {
        Routes.get('/:id/subjects', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                CompService.getSubjects([req.params.id], {select: "_id name survey.date"}, function (err, subjects) {
                    if (err) {
                        return res.status(200).json({subjects: null, errors: err});
                    }
                    else {
                        return res.status(200).json({subjects: subjects});
                    }
                });
            })
        })

        Routes.put('/:id/comps/:compid', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.linkComp(req.user, req.context, null, req.params.id, req.params.compid, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })

        Routes.delete('/:id/comps/:compid', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.unlinkComp(req.user, req.context, null, req.params.id, req.params.compid, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })

        Routes.post('/:id/comps/saveOrder', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                req.body.compids = req.body.compids || [];

                PropertyService.search(req.user, {
                        limit: 20,
                        permission: 'PropertyManage',
                        ids: [req.params.id],
                        select: "_id comps.id"}, function(err, comps) {

                    var old = _.map(comps[0].comps, function(x) {return x.id.toString()});

                    //Do not try to remove yourself as a comp;
                    _.remove(old,function(x) {return x == req.params.id.toString()});

                    var added = _.difference(req.body.compids, old);
                    var removed = _.difference(old, req.body.compids);


                    async.eachLimit(added, 10, function(id, callbackp){
                        PropertyService.linkComp(req.user, req.context, null, req.params.id, id, function (err, newLink) {
                            callbackp();

                        });
                    }, function(err) {
                        async.eachLimit(removed, 10, function(id, callbackp){
                            PropertyService.unlinkComp(req.user, req.context, null, req.params.id, id, function (err, newLink) {
                                callbackp();

                            });
                        }, function(err) {
                            //return res.status(401).json("Unauthorized request");
                            var order = [];
                            req.body.compids.forEach(function(x, i) {
                               order.push({compid: x, orderNumber: i});
                            });
                            async.eachLimit(order, 10, function(o, callbackp){
                                CompService.saveCompOrder(req.params.id, o.compid, o.orderNumber, function (err, newLink) {
                                    callbackp();
                                });
                            }, function(err) {
                                return res.status(200).json({success: true});
                            });

                        });
                    });
                    // console.log('Added: ', added);
                    // console.log('Removed: ', removed);


                })


            })
        })

        Routes.post('/:id/comps/:compid', function (req, res) {
            AccessService.canAccessResource(req.user,req.params.id,'PropertyManage', function(canAccess) {
                if (!canAccess) {
                    return res.status(401).json("Unauthorized request");
                }

                PropertyService.saveCompLink(req.user, req.context, null, req.params.id, req.params.compid, req.body.floorplans, function (err, newusr) {
                    if (err) {
                        return res.status(200).json({success: false, errors: err});
                    }
                    else {
                        return res.status(200).json({success: true});
                    }
                });
            })
        })


    }
}