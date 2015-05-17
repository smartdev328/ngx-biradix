var RedisService = require('../../utilities/services/redisService')

module.exports = {
    setComplete: function(progressId) {
        RedisService.set(progressId, progressId, 60 * 5 * 1000);
    },
    isComplete: function(progressId, callback) {
        RedisService.get(progressId, function(err, result) {
            callback(result);
        });
    },
}