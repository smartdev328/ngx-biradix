'use strict';
define(['app'], function (app) {
    app.factory('$contactService', ['$http', function ($http,$cookies) {
        var fac = {};

        fac.send = function (msg) {
            return $http.post('/contact/send'+ '?bust=' + (new Date()).getTime(), msg).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }


        return fac;
    }]);
});