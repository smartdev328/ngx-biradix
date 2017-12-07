'use strict';
var express = require('express');
var Routes = express.Router();
var settings = require("../../../config/settings")
var AWS = require('aws-sdk');
var uuid = require("node-uuid");

Routes.post('/', function (req, res) {
    var s3Bucket = new AWS.S3( { params: {Bucket: settings.AWS_S3_BUCKET_IMAGES} } );
    var buf = new Buffer(req.body.image.replace(/^data:image\/\w+;base64,/, ""),'base64')
    var file = "temp_" + uuid.v1() + ".jpg";
    var url = "https://s3.amazonaws.com/"+settings.AWS_S3_BUCKET_IMAGES+"/" + file;
    var data = {
        ACL: 'public-read',
        Key: file,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg'
    };
    s3Bucket.putObject(data, function(err, data){
        if (err) {
            throw new error(err);
        } else {
            return res.status(200).json({
                image: {
                    url : url,
                    width: req.body.width,
                    height: req.body.height
                }});
        }
    });


});

module.exports = Routes;