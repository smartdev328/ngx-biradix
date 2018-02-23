var PropertyService = require('../../properties/services/propertyService')
var CompService = require('../services/compsService')
var CloneService = require('../services/cloneService')
var _ = require("lodash");
var async = require("async");

module.exports = {
    saveComps: function(operator, context, subjectId, compIds, callback) {
        PropertyService.search(operator, {
            limit: 20,
            permission: 'PropertyManage',
            ids: [subjectId.toString()],
            select: "_id comps.id custom"}, function(err, comps) {

            CloneService.getClonedComps(operator, context,comps[0],compIds, function(updatedCompIds) {

                var old = _.map(comps[0].comps, function(x) {return x.id.toString()});

                //Do not try to remove yourself as a comp;
                _.remove(old,function(x) {return x == subjectId.toString()});

                var added = _.difference(updatedCompIds, old);
                var removed = _.difference(old, updatedCompIds);


                async.eachLimit(added, 10, function(id, callbackp){
                    PropertyService.linkComp(operator, context, null, subjectId, id, function (err, newLink) {
                        callbackp();

                    });
                }, function(err) {
                    async.eachLimit(removed, 10, function(id, callbackp){
                        PropertyService.unlinkComp(operator, context, null, subjectId, id, function (err, newLink) {
                            callbackp();

                        });
                    }, function(err) {
                        //return res.status(401).json("Unauthorized request");
                        var order = [];
                        updatedCompIds.forEach(function(x, i) {
                            order.push({compid: x, orderNumber: i});
                        });
                        async.eachLimit(order, 10, function(o, callbackp){
                            CompService.saveCompOrder(subjectId, o.compid, o.orderNumber, function (err, newLink) {
                                callbackp();
                            });
                        }, function(err) {
                            callback();
                        });

                    });
                });
            })

        })        
    }
}