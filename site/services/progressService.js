'use strict';
define(['app'], function (app) {
    app.factory('$progressService', ['$http', function ($http,$cookies) {
        var fac = {};

        fac.isComplete = function (progressId, callback) {
            return $http.get('/progress/' + progressId).success(function (response) {
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
});