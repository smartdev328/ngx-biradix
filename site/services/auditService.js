'use strict';
define([
    'app',
], function (app) {
    app.factory('$auditService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.search = function (criteria) {
            return $http.post('/api/1.0/audit', criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.create = function (audit) {
            return $http.put('/api/1.0/audit', audit, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});