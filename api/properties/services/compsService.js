'use strict';
var PropertySchema= require('../schemas/propertySchema')
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var AuditService = require('../../audit/services/auditService')

module.exports = {
    linkComp: function (operator, context, revertedFromId, logHistory, subjectid, compid, callback) {
        PropertySchema.findOne({_id: subjectid}, function (err, subj) {
            if (_.find(subj.comps, function (c) {
                    return c.id.toString() == compid.toString()
                })) {
                return callback("Comp already exists", null);
            }

            PropertySchema.findOne({_id: compid}, function (err, comp) {
                if (err) {
                    callback(err, null)
                } else {

                    var ObjectId = require('mongoose').Types.ObjectId;
                    var link = {id: new ObjectId(compid), floorplans: _.pluck(comp.floorplans, "id")}
                    var query = {_id: subjectid};
                    var update = {$addToSet: {comps: link}};
                    var options = {new: true};

                    PropertySchema.findOneAndUpdate(query, update, options, function (err, saved) {

                        if (logHistory) {
                            AuditService.create({
                                operator: operator,
                                property: saved,
                                type: 'comp_linked',
                                revertedFromId: revertedFromId,
                                description: subj.name + " + " + comp.name,
                                context: context,
                                data: [{
                                    description: "Subject: " + subj.name,
                                    id: subj._id
                                }, {description: "Comp: " + comp.name, id: comp._id},]
                            })
                        }
                        return callback(err, saved)
                    })
                }
            })
        })
    },
    getSubjects: function(compid, criteria, callback) {

        var ObjectId = require('mongoose').Types.ObjectId;
        var query = PropertySchema.find({'comps.id': new ObjectId(compid)});
        query.select(criteria.select);
        query.exec(callback);
    }
}