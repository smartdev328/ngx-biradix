"use strict";
const LiquidService = require("../../utilities/services/liquidService");
const settings = require("../../../config/settings");
const fs = require("fs");
const serviceRegistry = require("../../../build/services/gateway/ServiceRegistry");
const _ = require("lodash");

const filters = {
    formatNumber: function(input, decimals) {
        if (typeof input == "undefined" || input == null || isNaN(input) || input === "") {
            return "";
        }

        return parseFloat(input).toLocaleString("en-US", {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
    },
};

module.exports = {
    send: function(email, callback) {
        email.width = email.width || 600;

        let newemail = {
            from: email.from || "BI:Radix Team <support@biradix.com>",
            to: email.to,
            bcc: email.bcc,
            subject: email.subject,
        };

        if (email.attachments) {
            newemail.attachments = email.attachments;

            newemail.attachments.forEach((a) => {
               a.content = (new Buffer(a.content)).toString("base64");
            });
        }

        if (email.category) {
            if (_.isArray(email.category)) {
                newemail.categories = email.category;
            } else {
                newemail.categories = [email.category];
            }
        }

        getData(email, function(html) {
            fs.readFile(settings.PROJECT_DIR +"/../api/business/templates/email.html", "utf8", function(err, data) {
                if (err) {
                    throw (err);
                } else {

                    if (email.stripBreaks) {
                        html = html.replace(/\r?\n/g, "");
                    }
                    LiquidService.parse(data, {message: html, logo: email.logo, width: email.width, logoHeight: email.logoHeight}, filters, function(result) {
                        newemail.html = result;
                        serviceRegistry.getEmailService().send(newemail).then((success) => {
                            console.log("Email Sent Success: ", success);
                            callback(null, success);
                        }).catch((error) => {
                            console.error("Email Sent Error: ", error);
                            callback(error, null);
                        });
                    });
                }
            });
        });
    },
};

function getData(email, callback) {
    if (email.template) {
        fs.readFile(settings.PROJECT_DIR +"/../api/business/templates/" + email.template, "utf8", function(err, data) {
            if (err) {
                throw (err);
            } else {
                LiquidService.parse(data, email.templateData, filters, function(result) {
                    callback(result);
                });
            }
        });
    } else {
        callback(email.html);
    }
}
