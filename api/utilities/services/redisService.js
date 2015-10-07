var settings = require('../../../config/settings.js')
var Redis = require('ioredis');
var redis = new Redis(settings.REDIS_URL);
var md5 = require('MD5');

module.exports = {
    get:function(key, callback) {
        redis.get(md5(key), function(err, result) {
            if (result) {
                callback(err, JSON.parse(result))
            }
            else {
                callback(err, result)
            }
        });
    },
    set:function(key, result, expireInMinutes) {
        redis.set(md5(key), JSON.stringify(result));
        redis.expire(md5(key), expireInMinutes * 60);
    }
}