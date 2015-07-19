'use strict';
var AuditSchema= require('../schemas/auditSchema')
var async = require("async");
var _ = require("lodash")

var WEEK = 7 * 24 * 60 * 60 * 1000;

var audits  = [
    {key: 'login_failed', value: 'Login Failed'},
    {key: 'login_succeeded', value: 'Login Succeeded'},
];

module.exports = {
    audits: audits,
    create: function(audit,callback) {
        var n = new AuditSchema();

        n.operator = {
            id: audit.operator.id || audit.operator._id,
            name: audit.operator.name || (audit.operator.first + ' ' + audit.operator.last)
        }
        if (audit.user) {
            n.user = {
                id: audit.user.id || audit.user._id,
                name: audit.user.name || (audit.user.first + ' ' + audit.user.last)
            };
        }
        n.context = audit.context;
        n.type = audit.type;
        n.description = audit.description;

        n.save(callback);
    }

}