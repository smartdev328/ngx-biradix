'use strict';
var PropertySchema= require('../schemas/propertySchema')
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var AuditService = require('../../audit/services/auditService')
var AccessService = require('../../access/services/accessService')

module.exports = {
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
                AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO'], cache:true},function (err, roles) {
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
            var CMRole = _.find(all.CMroles, function(x) {return x.tags.indexOf('CM') > -1 && x.orgid.toString() == all.subject.orgid.toString()});

            var ObjectId = require('mongoose').Types.ObjectId;
            var link = {id: new ObjectId(compid), floorplans: _.pluck(all.comp.floorplans, "id")}
            var query = {_id: subjectid};
            var update = {$addToSet: {comps: link}};
            var options = {new: true};

            PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {

                AccessService.createPermission({executorid: RMRole._id ,resource: new ObjectId(compid),allow: true,type: 'CompManage'}, function () {});
                AccessService.createPermission({executorid: BMRole._id ,resource: new ObjectId(compid),allow: true,type: 'CompManage'}, function () {});
                AccessService.createPermission({executorid: CMRole._id ,resource: new ObjectId(compid),allow: true,type: 'CompManage'}, function () {});

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
                }
                return callback(err, saved)
            })

        });

    },
    getSubjects: function(compid, criteria, callback) {

        var ObjectId = require('mongoose').Types.ObjectId;
        var query = PropertySchema.find({'comps.id': new ObjectId(compid)});
        query.select(criteria.select);
        query.exec(callback);
    }
}