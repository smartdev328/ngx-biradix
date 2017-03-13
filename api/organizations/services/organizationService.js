'use strict';

var OrganizationSchema= require('../schemas/organizationSchema')
var AuditService = require('../../audit/services/auditService')

module.exports = {
    read: function(callback) {
        var query = OrganizationSchema.find({})
        query = query.sort("name")
        query.exec(function(err, orgs) {
            orgs.forEach(function(o) {
                defaultSettings(o);
            })
            callback(err,orgs);
        });
    },
    defaultSettings: function(operator, context, id, settings, callback) {

        OrganizationSchema.findOne({_id:id}, function(err, org) {
            if (err || !org) {
                return callback([{param: 'name', msg : 'Unable to find organization'}], null);
            }

            defaultSettings(org);

            var d;
            var f;
            var data = []
            for (var s in org.settings) {
                var o = org.settings[s];
                var n = settings[s];

                if (o.configured != n.configured || o.allow != n.allow || o.default_value != n.default_value) {
                    d = "[" + s.toString()+"] ";
                    f = false;

                    if (o.allow != n.allow) {
                        d += ("Allow Change: " + o.allow + " => " + n.allow);
                        f = true;
                    }

                    if (o.configured != n.configured) {
                        if (f) {
                            d+= ", ";
                        }
                        d += ("Configured: " + o.configured + " => " + n.configured);
                        f = true;
                    }

                    if (o.default_value != n.default_value) {
                        if (f) {
                            d+= ", ";
                        }
                        d += ("Default: " + o.default_value + " => " + n.default_value);
                        f = true;
                    }

                    data.push({description: d})
                }
            }

            var query = {_id: id};
            var update = {settings: settings};
            var options = {};

            OrganizationSchema.findOneAndUpdate(query, update, options, function (err, saved) {

                if (err) {
                    callback([{msg: 'Unable to update organization.'}], null);
                    return;
                }

                if (data.length > 0) {
                    AuditService.create({
                        operator: operator,
                        type: 'org_default_settings',
                        description: org.name + " - " + data.length + " update(s)",
                        context: context,
                        data: data
                    })
                }

                return callback();
            });

        })
    },
    create : function(org, callback)  {
        var modelErrors = [];
        org.name = org.name || '';
        org.subdomain = org.subdomain || '';
        org.logoBig = org.logoBig || '';
        org.logoSmall = org.logoSmall || '';
        org.isDefault = org.isDefault || false;

        if (org.name == '')
        {
            modelErrors.push({param: 'name', msg : 'Please enter organization name'});
        }

        if (org.subdomain == '')
        {
            modelErrors.push({param: 'subdomain', msg : 'Please enter organization subdomain'});
        }

        if (org.logoBig == '')
        {
            modelErrors.push({param: 'logoBig', msg : 'Please enter organization logo (big))'});
        }

        if (org.logoSmall == '')
        {
            modelErrors.push({param: 'logoSmall', msg : 'Please enter organization logo (small)'});
        }

        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }
        OrganizationSchema.findOne({
            subdomain: org.subdomain
        }, function(err, dupe) {
            if (err) {
                modelErrors.push({msg : 'Unexpected Error. Unable to create organziaion.'});
                callback(modelErrors, null);
                return;
            };

            if (dupe) {
                modelErrors.push({param: 'subdomain', msg : 'Subdomain already exists.'});
                callback(modelErrors, null);
                return;
            }
            var newOrg = new OrganizationSchema();

            newOrg.name = org.name || '';
            newOrg.subdomain = org.subdomain || '';
            newOrg.logoBig = org.logoBig || '';
            newOrg.logoSmall = org.logoSmall || '';
            newOrg.isDefault = org.isDefault || false;

            newOrg.save(function (err, org) {
                if (err) {
                    modelErrors.push({msg : 'Unexpected Error. Unable to create organization.'});
                    callback(modelErrors, null);
                    return;
                };

                callback(null, org);

            });
        });

    }
}

function defaultSettings(org) {
    org.settings = org.settings || {};
    org.settings.updates = org.settings.updates || {
            allow: true,
            configured: false,
            default_value: true
        };
    org.settings.how_often = org.settings.how_often || {
            allow: true,
            configured: false,
            default_value: "* * * * 2"
        };
    org.settings.all_properties = org.settings.all_properties || {
            allow: true,
            configured: false,
            default_value: true
        };
    org.settings.reminders = org.settings.reminders || {
            allow: true,
            configured: false,
            default_value: true
        };
    org.settings.leased = org.settings.leased || {
            allow: true,
            configured: false,
            default_value: true
        };
    org.settings.renewal = org.settings.renewal || {
            allow: true,
            configured: false,
            default_value: true
        };
    org.settings.detailed_concessions = org.settings.detailed_concessions || {
            allow: true,
            configured: false,
            default_value: false
        };
}