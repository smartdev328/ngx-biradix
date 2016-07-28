'use strict';

var OrganizationSchema= require('../schemas/organizationSchema')
var localCacheService = require('../../utilities/services/localcacheService')

module.exports = {
    read: function(callback) {
        var key = "orgs2";

        var orgs =  localCacheService.get(key);

        if (orgs) {
            callback(null, orgs)
        } else {
            var query = OrganizationSchema.find({})
            query = query.sort("name")
            query.exec(function(err, orgs) {
                localCacheService.set(key, orgs, 60)
                callback(err,orgs);
            });
        }

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