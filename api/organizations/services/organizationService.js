'use strict';

var OrganizationSchema= require('../schemas/organizationSchema')
var AuditService = require('../../audit/services/auditService')
var AccessService = require('../../access/services/accessService')
var _ = require("lodash")
module.exports = {
    hydrateOrgRoles: function() {
        var self = this;
        AccessService.getRoles({tags: ['Admin','CM', 'RM', 'BM', 'Guest', 'PO'], cache: false}, function (err, roles) {
            self.read(function(err, orgs) {
                roles = JSON.parse(JSON.stringify(roles));
                var org;
                roles.forEach(function (r) {
                    r.orgid = r.orgid.toString();
                    org = _.find(orgs, function (o) {
                        return o._id.toString() == r.orgid;
                    });
                    r.org = org;
                    AccessService.upsertOrgRole_read(r,function() {});
                })
            })
        });
    },
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
            var c;
            var found;
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

                    if (s == "notification_columns") {
                        found = {};
                        for (c in o.default_value) {
                            if (o.default_value[c] !== n.default_value[c]) {
                                found[c] = o.default_value[c].toString()+' => '+ n.default_value[c].toString();
                            }
                        }
                        if (Object.keys(found).length > 0) {
                            if (f) {
                                d += ", ";
                            }
                            d += ("Default: " + JSON.stringify(found));
                            f = true;
                        }

                    } else {
                        if (JSON.stringify(o.default_value) != JSON.stringify(n.default_value)) {
                            if (f) {
                                d += ", ";
                            }
                            d += ("Default: " + JSON.stringify(o.default_value) + " => " + JSON.stringify(n.default_value));
                            f = true;
                        }
                    }

                    data.push({description: d})
                }
            }

            var query = {_id: id};
            var update = {settings: settings};
            var options = {new: true};

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

                AccessService.orgUpdated(saved, function() {});

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

                org = JSON.parse(JSON.stringify(org));
                defaultSettings(org);

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
            default_value: false
        };
    org.settings.renewal = org.settings.renewal || {
            allow: true,
            configured: false,
            default_value: false
        };
    org.settings.detailed_concessions = org.settings.detailed_concessions || {
            allow: true,
            configured: false,
            default_value: false
        };

    org.settings.notification_columns = org.settings.notification_columns || {
        allow: true,
        configured: false,
        default_value: {
            occupancy: true,
            leased: true,
            units: true,
            sqft: true,
            rent: true,
            runrate: false,
            runratesqft: false,
            ner: true,
            nersqft: true,
            nersqftweek: true,
            nersqftmonth: true,
            nersqftyear: false,
            last_updated: true,
            weekly: false,
            concessions: false,
            nervscompavg : false
        }
    }
}