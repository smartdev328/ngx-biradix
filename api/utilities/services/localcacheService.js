var cache = require('memory-cache');
var md5 = require('MD5');

module.exports = {
    get:function(key) {

        var result = cache.get(md5(key))

        if (result) {
            return JSON.parse(result);
        }

        return null;

    },
    set:function(key, result, expireInMinutes) {
        cache.put(md5(key), JSON.stringify(result), expireInMinutes * 60 * 60 * 1000);
    }
}