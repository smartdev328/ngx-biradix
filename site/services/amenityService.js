'use strict';
define([
    'app',
], function (app) {
    app.factory('$amenityService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.search = function (criteria) {
            return $http.post('/api/1.0/amenities'+ '?bust=' + (new Date()).getTime(), criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.update = function (amenity) {
            return $http.put('/api/1.0/amenities/update'+ '?bust=' + (new Date()).getTime(), amenity, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

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