'use strict';
var AuditSchema= require('../schema/auditSchema')
var async = require("async");
var _ = require("lodash")
var PaginationService = require('../../utilities/services/paginationService')
var DateService = require('../../utilities/services/dateService')

var audits  = [
    {key: 'login_failed', value: 'Login Failed'},
    {key: 'login_succeeded', value: 'Login Succeeded'},
    {key: 'login_as', value: 'Login As'},
    {key: 'property_profile', value: 'Profile Viewed', excludeDefault: true},
    {key: 'pdf_profile', value: 'PDF Profile'},
    {key: 'print_profile', value: 'Print Profile'},
    {key: 'excel_profile', value: 'Excel Profile'},
    {key: 'report', value: 'Report'},
    {key: 'report_print', value: 'Report Print'},
    {key: 'report_pdf', value: 'Report Pdf'},
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
        if (audit.data) {
            n.data = audit.data;
        }
        n.context = audit.context;
        n.type = audit.type;
        n.description = audit.description;
        n.date = new Date().toISOString();

        n.save(callback);
    },
    get: function(criteria, userids, callback) {

        criteria.operatorids = userids;

        var query = QueryBuilder(criteria);

        query.count(function(err, obj) {

            if (err) {
                callback(err,[],PaginationService.getPager(criteria.skip, criteria.limit, 0))
            }
            else if (obj == 0) {
                callback(null,[],PaginationService.getPager(criteria.skip, criteria.limit, 0))
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


    if (criteria.operatorids.length > 0) {
        if (criteria.users && criteria.users.length > 0) {
            query = query.or([
                {
                    $and: [
                        {"operator.id": {$in: criteria.operatorids}},
                        {"user.id": {$in: criteria.users}},
                    ]
                },
                {"operator.id": {$in:  _.intersection(criteria.operatorids, criteria.users)}},
            ])

        }
        else {
            query = query.where("operator.id").in(criteria.operatorids);
        }
    } else {
        if (criteria.users && criteria.users.length > 0) {
            query = query.or([
                {"operator.id": {$in : criteria.users}},
                {"user.id": {$in : criteria.users}},
                ])
        }
    }

    if (criteria.types && criteria.types.length > 0) {
        query = query.where("type").in(criteria.types);
    }

    if (criteria.properties && criteria.properties.length > 0) {
        query = query.where("property.id").in(criteria.properties);
    }

    if (criteria.daterange) {
        var dr = DateService.convertRangeToParts(criteria.daterange);
        if (criteria.daterange != "Lifetime") {
            query = query.where("date").gte(dr.start).lte(dr.end);
        }

    }

    return query;
}