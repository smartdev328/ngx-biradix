'use strict';
var PropertySchema= require('../schemas/propertySchema')
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var AuditService = require('../../audit/services/auditService')
var AccessService = require('../../access/services/accessService')
var guestQueueService = require('../../propertyusers/services/guestsQueueService')
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
                AccessService.getOrgRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO','Guest']},function (err, roles) {
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

                guestQueueService.updateGuestPermissionsForProperty(compid, function() {});

                return callback(err, saved)
            })

        });

    },
    getSubjects: function(compid, criteria, callback) {
        const ObjectId = require('mongoose').Types.ObjectId;
        if (!_.isArray(compid)) {
            compid = [compid];
        }

        compid = _.map(compid, function(x) {
            return new ObjectId(x);
        });

        const query = PropertySchema.find({"comps.id": {$in: compid}});
        query.select(criteria.select);

        if (criteria.active) {
            query.where("active").equals(true);
        }
        query.exec(callback);
    },
    getCompsForGuest: function(guestid, compid, callback) {
        const ObjectId = require("mongoose").Types.ObjectId;
        compid = new ObjectId(compid);

        let query = PropertySchema.find({"comps.id": {$in: [compid]}});
        query.select("_id name survey.date comps.id");
        query.where("active").equals(true);
        let compids = [];
        let temp;
        query.exec((errors, subjects) => {
            let properties = JSON.parse(JSON.stringify(subjects));

            // Remove yourself as a subject just in case
            _.remove(properties, (x) => x._id.toString() === compid.toString());

            // Get all compids of all subjects
            properties.forEach((p) => {
                temp = p.comps.map((c) => c.id);

                // Remove yourself as a comp for unique counts
                _.remove(temp, (x) => x.toString() === p._id.toString());
                compids = compids.concat(temp);
            });

            // Get unique counts of each comp occurrence for sorting
            const counts = _.countBy(compids, (i) => i);

            // Get Unique list
            compids = _.uniq(compids);

            // Convert to Objects
            compids = _.map(compids, function(x) {
                return new ObjectId(x);
            });

            // Get Comps of Subjects
            query = PropertySchema.find({_id: {$in: compids}});
            query.select("_id name survey.date loc");
            query.where("active").equals(true);
            query.exec((errors, compsofSubjects) => {
                let comps = JSON.parse(JSON.stringify(compsofSubjects));

                // Find yourself to get geo loc
                const me = comps.find((x) => x._id.toString() === compid.toString());

                // Remove yourself and subjects we already found
                _.remove(comps, (x) => {
                    return x._id === me._id || _.find(properties, (y) => y._id === x._id);
                });

                // Join on number of subjects
                comps.forEach((c) => {
                   c.subjectCount = counts[c._id.toString()];
                   c.distance = getDistanceInMiles(me.loc, c.loc);
                });

                // Sort by subjectCount asc, distance desc so we can pop off the top in reverse order
                comps = _.sortByOrder(comps, ["subjectCount", "distance"], [true, false]);

                let compToAdd;
                // keep grabbing from list until we fill 7 total or run out
                while (properties.length < 7 && comps.length > 0) {
                    compToAdd = comps.pop();
                    properties.push(compToAdd);

                    // Remove and re-add view permissions to this property
                    AccessService.deletePermission({executorid: guestid, resource: new ObjectId(compToAdd._id), type: "PropertyView"}, function(err, perm) {
                        AccessService.createPermission({
                            executorid: guestid,
                            resource: new ObjectId(compToAdd._id),
                            allow: true,
                            type: "PropertyView",
                        }, function() {});
                    });
                }

                callback(errors, properties);
            });
        });
    },
};
const rad = function(x) {
    return x * Math.PI / 180;
};

const getDistanceInMiles = function(p1, p2) {
    const R = 6378137; // Earth’s mean radius in meter
    const dLat = rad(p2[1] - p1[1]);
    const dLong = rad(p2[0] - p1[0]);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1[1])) * Math.cos(rad(p2[1])) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // returns the distance in meter
    // m/1,609.344=mi
    return Math.round(d / 1609.344 * 10) / 10;
};
