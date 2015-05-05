'use strict';
var settings = require('../../../config/settings')
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var options = {
    auth: {
        api_user: settings.SENDGRID_USERNAME,
        api_key: settings.SENDGRID_PASSWORD
    }
}

var client = nodemailer.createTransport(sgTransport(options));

module.exports = {
    //var email = {
    //    from: 'awesome@bar.com',
    //    to: 'mr.walrus@foo.com',
    //    subject: 'Hello',
    //    text: 'Hello world',
    //    html: '<b>Hello world</b>'
    //};

    send: function (email, callback) {
        client.sendMail(email,function(emailError,status) {
            return callback(emailError, status);
        });
    }
}
