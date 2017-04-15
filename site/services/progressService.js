angular.module('biradix.global').factory('$progressService', ['$http', function ($http,$cookies) {
        var fac = {};

        fac.isComplete = function (progressId, callback) {
            return $http.get('/progress/' + progressId+ '?bust=' + (new Date()).getTime()).success(function (response) {
                if (response.progressId) {
                    callback(true);
                }
                else {
                    callback(false);
                }
            }).error(function (response) {
                callback(false);
            });
        }


        return fac;
    }]);
