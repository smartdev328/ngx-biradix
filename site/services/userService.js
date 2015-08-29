'use strict';
define([
    'app',
], function (app) {
    app.factory('$userService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.getRolesToAssign = function () {
            return $http.get('/api/1.0/access/roles', {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.search = function (criteria) {
            return $http.post('/api/1.0/users', criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setActive = function (active, userId) {
            return $http.put('/api/1.0/users/' + userId + '/active', { active: active}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});