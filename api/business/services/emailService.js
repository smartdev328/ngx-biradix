'use strict';
var LiquidService = require('../../utilities/services/liquidService')
var EmailService = require('../../utilities/services/emailService')
var fs = require('fs')

module.exports = {
    send: function (email, callback) {
        var newemail = {
            from: email.from || 'support@biradix.com',
            to: email.to,
            subject: email.subject
        };

        getData(email, function(html) {
            fs.readFile(process.cwd() +'/api/business/templates/email.html', 'utf8', function (err,data) {
                if (err) {
                    throw (err)
                }
                else {
                    LiquidService.parse(data, {message: html, logo: email.logo }, null, function(result) {
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
        fs.readFile(process.cwd() +'/api/business/templates/' + email.template, 'utf8', function (err,data) {
            if (err) {
                throw (err)
            }
            else {
                LiquidService.parse(data, email.templateData, null, function(result) {
                    callback(result);
                })
            }

        });
    } else {
        callback(email.html)
    }
}