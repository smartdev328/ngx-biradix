'use strict';
define([
    'app',
], function (app) {
    app.factory('$amenityService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.create = function (amenity) {
            return $http.put('/api/1.0/amenities'+ '?bust=' + (new Date()).getTime(), amenity, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});