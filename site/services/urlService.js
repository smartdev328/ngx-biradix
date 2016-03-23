'use strict';
define([
    'app',
], function (app) {
    app.factory('$urlService', ['$http', function ($http,$cookies) {
        var fac = {};

        fac.shorten = function (url) {
            return $http.post('/url'+ '?bust=' + (new Date()).getTime(), {url:url}, {}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});