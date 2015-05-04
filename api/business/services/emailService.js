'use strict';
var LiquidService = require('../../utilities/services/liquidService')
var EmailService = require('../../utilities/services/emailService')
var fs = require('fs')

module.exports = {
    send: function (email, callback) {
        var newemail = {
            from: 'support@banneredgemedia.com',
            to: email.to,
            subject: email.subject
        };

        //console.log()
        fs.readFile(process.cwd() +'/api/business/templates/email.html', 'utf8', function (err,data) {
            if (err) {
                throw (err)
            }
            else {
                LiquidService.parse(data, {message: email.html, logo: process.env.baseurl + "/images/logo.png" }, null, function(result) {
                    newemail.html = result;
                    EmailService.send(newemail,callback);
                })
            }

        });

    }
}
