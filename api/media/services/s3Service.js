var settings = require("../../../config/settings")
var AWS = require('aws-sdk');
var uuid = require("node-uuid");
var _ = require("lodash")

module.exports = {
    copyImage : function(source, callback) {
        var s3Bucket = new AWS.S3( { params: {Bucket: settings.AWS_S3_BUCKET_IMAGES} } );

        var file = uuid.v1() + ".jpg";
        var path = "/";
        var url = "https://" + settings.AWS_S3_CDN_IMAGES + path + file;

        var params = {
            ACL: 'public-read',
            CopySource: source.url.replace("https://" + settings.AWS_S3_CDN_IMAGES, settings.AWS_S3_BUCKET_IMAGES),
            Key: file
        };

        s3Bucket.copyObject(params, function(copyErr, copyData){
            var newMedia = _.cloneDeep(source);
            newMedia.url = url;
            callback(copyErr, copyErr ? null : newMedia);
        });

    }
}