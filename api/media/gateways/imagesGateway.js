"use strict";
const express = require("express");
const Routes = express.Router();
const settings = require("../../../config/settings");
const AWS = require("aws-sdk");
const uuid = require("node-uuid");

Routes.post("/", function(req, res) {
    let s3Bucket = new AWS.S3({params: {Bucket: settings.AWS_S3_BUCKET_IMAGES}});
    let buf = new Buffer(req.body.image.replace(/^data:image\/\w+;base64,/, ""), "base64");

    let file = uuid.v1() + ".jpg";
    let path = "/";
    let url = "https://" + settings.AWS_S3_CDN_IMAGES + path + file;

    let data = {
        ACL: "public-read",
        Key: file,
        Body: buf,
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
    };
    s3Bucket.putObject(data, function(err, data) {
        if (err) {
            console.log("S3 Error: ", err);
            throw new Error(err);
        } else {
            return res.status(200).json({
                image: {
                    name: req.body.name,
                    url: url,
                    width: req.body.width,
                    height: req.body.height,
                }});
        }
    });
});

module.exports = Routes;
