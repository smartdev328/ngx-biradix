'use strict';
var LiquidService = require('../../utilities/services/liquidService')
var EmailService = require('../../utilities/services/emailService')
var settings = require('../../../config/settings')
var fs = require('fs')

var filters = {
    formatNumber: function(input,decimals) {

        if (typeof input == 'undefined' || input == null || isNaN(input) || input === '') {
            return "";
        }

        return parseFloat(input).toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
    }
}

module.exports = {
    send: function (email, callback) {
        var newemail = {
            from: email.from || 'BIRadix Team <support@biradix.com>',
            to: email.to,
            bcc: email.bcc,
            subject: email.subject
        };

        getData(email, function(html) {
            fs.readFile(settings.PROJECT_DIR +'/../api/business/templates/email.html', 'utf8', function (err,data) {
                if (err) {
                    throw (err)
                }
                else {
                    LiquidService.parse(data, {message: html, logo: email.logo }, filters, function(result) {
                        newemail.html = result;
                        EmailService.send(newemail,callback);
                    })
                }

            });
        })
    }
}

function getData(email, callback) {
    if (email.template) {
        fs.readFile(settings.PROJECT_DIR +'/../api/business/templates/' + email.template, 'utf8', function (err,data) {
            if (err) {
                throw (err)
            }
            else {
                LiquidService.parse(data, email.templateData, filters, function(result) {
                    callback(result);
                })
            }

        });
    } else {
        callback(email.html)
    }
}