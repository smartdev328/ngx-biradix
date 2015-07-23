'use strict';
var AuditSchema= require('../schema/auditSchema')
var async = require("async");
var _ = require("lodash")
var PaginationService = require('../../utilities/services/paginationService')

var audits  = [
    {key: 'login_failed', value: 'Login Failed'},
    {key: 'login_succeeded', value: 'Login Succeeded'},
    {key: 'login_as', value: 'Login As'},
    {key: 'property_profile', value: 'Profile Viewed'},
];

module.exports = {
    audits: audits,
    create: function(audit,callback) {
        var n = new AuditSchema();

        if (audit.operator) {
            n.operator = {
                id: audit.operator.id || audit.operator._id,
                name: audit.operator.name || (audit.operator.first + ' ' + audit.operator.last)
            }
        }
        if (audit.user) {
            n.user = {
                id: audit.user.id || audit.user._id,
                name: audit.user.name || (audit.user.first + ' ' + audit.user.last)
            };
        }
        if (audit.property) {
            n.property = {
                id: audit.property.id || audit.property._id,
                name: audit.property.name
            };
        }
        n.context = audit.context;
        n.type = audit.type;
        n.description = audit.description;
        n.date = new Date().toISOString();

        n.save(callback);
    },
    get: function(criteria, callback) {
        var query = QueryBuilder(criteria);

        query.count(function(err, obj) {

            if (err) {
                callback(err,[],0)
            }
            else if (obj == 0) {
                callback(null,[],0)
            }
            else {
                var query = QueryBuilder(criteria).sort("-date").skip(criteria.skip).limit(criteria.limit);
                if (criteria.select) {
                    query = query.select(criteria.select);
                }
                query.exec(function(err, list) {
                    callback(err,list,PaginationService.getPager(criteria.skip, criteria.limit, obj))
                });
            }

        });
    }

}

function QueryBuilder (criteria) {
    criteria = criteria || {};

    criteria.skip = criteria.skip || 0;
    criteria.limit = criteria.limit || 50;

    var query = AuditSchema.find();

    return query;
}