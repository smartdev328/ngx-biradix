'use strict';
define([
    'app',
], function (app) {
    app.factory('$propertyAmenityService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.deleteAmenity = function (amenityid) {
            return $http.get(gAPI + '/api/1.0/propertyamenities/delete/' + amenityid+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.mapAmenity = function (amenityid, newid) {
            return $http.get(gAPI + '/api/1.0/propertyamenities/map/' + amenityid + '/' + newid + '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }
        
        return fac;
    }]);
});