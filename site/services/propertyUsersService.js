'use strict';
define([
    'app',
], function (app) {
    app.factory('$propertyUsersService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.getUserAssignedProperties = function (userid) {
            return $http.get('/api/1.0/propertyusers/properties/' + userid, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setPropertiesForUser = function (userid, properties) {
            return $http.put('/api/1.0/propertyusers/properties/' + userid, properties, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});