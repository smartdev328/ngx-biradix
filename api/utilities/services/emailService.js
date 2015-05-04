'use strict';
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var options = {
    auth: {
        api_user: process.env.SENDGRID_USERNAME,
        api_key: process.env.SENDGRID_PASSWORD
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
