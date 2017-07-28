var settings = require('../../../config/settings.js')
var Redis = require('redis');
var redis = Redis.createClient(settings.REDIS_URL);
var md5 = require('md5');

module.exports = {
    getByKey:function(key, callback) {
        redis.get(key.toString(), function(err, result) {
            if (result) {
                callback(err, JSON.parse(result))
            }
            else {
                callback(err, result)
            }
        });
    },
    get:function(key, callback) {
        let hash = md5(key.toString()).toString();
        redis.get(hash, (err, result) => {
            if (result) {
                callback(err, JSON.parse(result))
            }
            else {
                callback(err, result)
            }
        });
    },
    set:function(key, result, expireInMinutes) {
        redis.set(md5(key.toString()), JSON.stringify(result));
        redis.expire(md5(key.toString()), expireInMinutes * 60);
    }
}