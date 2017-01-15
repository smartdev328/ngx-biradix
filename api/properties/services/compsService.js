'use strict';
var PropertySchema= require('../schemas/propertySchema')
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var AuditService = require('../../audit/services/auditService')
var AccessService = require('../../access/services/accessService')

module.exports = {
    saveCompOrder:function(subjectid, compid, orderNumber, callback) {
        var ObjectId = require('mongoose').Types.ObjectId;
        var query = {_id: new ObjectId(subjectid), 'comps.id': new ObjectId(compid)};
        var update = {$set: {'comps.$.orderNumber': orderNumber}};

        PropertySchema.update(query, update, callback);

    },
    linkComp: function (operator, context, revertedFromId, logHistory, subjectid, compid, callback) {

        async.parallel({
            subject: function(callbackp) {
                PropertySchema.findOne({_id: subjectid}, function (err, subj) {
                    if (_.find(subj.comps, function (c) {
                            return c.id.toString() == compid.toString()
                        })) {
                        return callbackp("Comp already exists", null);
                    }

                    return callbackp(null, subj)
                })
            },
            subjectgrouprole: function(callbackp) {
                AccessService.getRoles({tags:[subjectid.toString()]}, callbackp);
            },
            CMroles: function(callbackp) {
                AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO','Guest'], cache:false},function (err, roles) {
                    callbackp(null, roles)
                });
            },
            comp: function(callbackp) {
                PropertySchema.findOne({_id: compid}, callbackp)
            }

        }, function(err, all) {
            if (err) {
                return callback([{msg: err[0]}], null);
            }

            var RMRole = _.find(all.subjectgrouprole, function(x) {return x.tags.indexOf('RM_GROUP') > -1});
            var BMRole = _.find(all.subjectgrouprole, function(x) {return x.tags.indexOf('BM_GROUP') > -1});
            var PORole = _.find(all.subjectgrouprole, function(x) {return x.tags.indexOf('PO_GROUP') > -1});
            var CMRole = _.find(all.CMroles, function(x) {return x.tags.indexOf('CM') > -1 && x.orgid.toString() == (all.subject.orgid || '').toString()});

            var ObjectId = require('mongoose').Types.ObjectId;
            var link = {id: new ObjectId(compid), floorplans: _.pluck(all.comp.floorplans, "id")}
            var query = {_id: subjectid};
            var update = {$addToSet: {comps: link}};
            var options = {new: true};

            PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {
                //Allows POs to view any comp they have as a subject
                if (PORole) {
                    AccessService.createPermission({
                        executorid: PORole._id,
                        resource: new ObjectId(compid),
                        allow: true,
                        type: 'PropertyView'
                    }, function () {
                    });
                    AccessService.createPermission({
                        executorid: PORole._id,
                        resource: new ObjectId(subjectid),
                        allow: true,
                        type: 'PropertyView'
                    }, function () {
                    });
                }

                //Allows RMs, BMs and CMs to manage any comp they have as a subject
                if (all.subject._id.toString() != all.comp._id.toString() && CMRole) {
                    AccessService.createPermission({
                        executorid: RMRole._id,
                        resource: new ObjectId(compid),
                        allow: true,
                        type: 'CompManage'
                    }, function () {
                    });
                    AccessService.createPermission({
                        executorid: BMRole._id,
                        resource: new ObjectId(compid),
                        allow: true,
                        type: 'CompManage'
                    }, function () {
                    });
                    AccessService.createPermission({
                        executorid: CMRole._id,
                        resource: new ObjectId(compid),
                        allow: true,
                        type: 'CompManage'
                    }, function () {
                    });
                }

                if (logHistory) {
                    AuditService.create({
                        operator: operator,
                        property: saved,
                        type: 'comp_linked',
                        revertedFromId: revertedFromId,
                        description: all.subject.name + " + " + all.comp.name,
                        context: context,
                        data: [{
                            description: "Subject: " + all.subject.name,
                            id: all.subject._id
                        }, {description: "Comp: " + all.comp.name, id: all.comp._id},]
                    })

                    AuditService.create({
                        operator: operator,
                        property: all.comp,
                        type: 'property_linked',
                        revertedFromId: revertedFromId,
                        description: all.subject.name + " + " + all.comp.name,
                        context: context,
                        data: [{
                            description: "Subject: " + all.subject.name,
                            id: all.subject._id
                        }, {description: "Comp: " + all.comp.name, id: all.comp._id},]
                    })
                }

                return callback(err, saved)
            })

        });

    },
    getSubjects: function(compid, criteria, callback) {

        var ObjectId = require('mongoose').Types.ObjectId;
        if (!_.isArray(compid)) {
            compid = [compid];
        }

        compid = _.map(compid, function(x) {return new ObjectId(x)})

        var ObjectId = require('mongoose').Types.ObjectId;
        var query = PropertySchema.find({'comps.id': {$in:  compid }});
        query.select(criteria.select);
        query.exec(callback);
    }
}