'use strict';
define([
    'app',
], function (app) {
    app.factory('$propertyUsersService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.getPropertyAssignedUsers = function (propertyid) {
            return $http.get('/api/1.0/propertyusers/users/' + propertyid, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

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

        fac.setUsersForProperty = function (propertyid, users) {
            return $http.put('/api/1.0/propertyusers/users/' + propertyid, users, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});