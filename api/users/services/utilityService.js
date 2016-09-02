'use strict';

var crypto = require('crypto')
var url = require('url');

module.exports = {
    sRegexEmail : /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    sRegexPassword : /^.{8,}$/,

    getPublicJSON: function (user) {
        if (!user) {
            return null;
        }
        var obj;
        try {
            obj = user.toObject();
        }
        catch (e) {
            obj = user;
        }
        delete obj.hashed_password;
        delete obj.salt;
        delete obj.emailLower;
        delete obj.widgetlayout;
        return obj;
    },

    makeSalt: function () {
        return crypto.randomBytes(16).toString('base64');
    },

    hashPassword: function (password, salt) {
        var bSalt = new Buffer(salt, 'base64');
        return crypto.pbkdf2Sync(password, bSalt, 10000, 64).toString('base64');
    },
    
    getOrgByUrl : function (orgs, base) {
        var subdomain = url.parse(base).hostname.toLowerCase();

        var org;

        if (orgs.length == 1) {
            org = orgs[0];
        } else {
            orgs.forEach(function(x) {
                if (x.subdomain.toLowerCase() == subdomain) {
                    org = x;
                }
            })

            if (!org) {
                org = orgs[0];
            }

        }

        return org;

    }
}
