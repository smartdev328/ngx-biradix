'use strict';
var request = require("request");
var settings = require("../../../config/settings")

module.exports = {
    resetBounce : function(email,callback) {
        //Authorization: Bearer YOUR_API_KEY
        //

       
        var data = {
            "emails": [
                email
            ]
        }

        var options = {
            url: "https://api.sendgrid.com/v3/suppression/bounces",
            body: JSON.stringify(data),
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : 'Bearer ' + settings.SENDGRID_API_KEY
            },
            timeout: 60000
        };

        request.delete(options, callback)
        
    }
}