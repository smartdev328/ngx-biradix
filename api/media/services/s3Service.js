const settings = require("../../../config/settings");
const AWS = require("aws-sdk");
const uuid = require("node-uuid");
const _ = require("lodash");

module.exports = {
    copyImage: function(source, callback) {
        let s3Bucket = new AWS.S3({params: {Bucket: settings.AWS_S3_BUCKET_IMAGES}});

        let file = uuid.v1() + ".jpg";
        let path = "/";
        let url = "https://" + settings.AWS_S3_CDN_IMAGES + path + file;

        let params = {
            ACL: "public-read",
            CopySource: source.url.replace("https://" + settings.AWS_S3_CDN_IMAGES, settings.AWS_S3_BUCKET_IMAGES),
            Key: file,
        };

        s3Bucket.copyObject(params, function(copyErr, copyData) {
            if (copyErr) {
                console.log("S3 Error: ", copyErr);
            }
            let newMedia = _.cloneDeep(source);
            newMedia.url = url;
            callback(copyErr, copyErr ? null : newMedia);
        });
    },
};
