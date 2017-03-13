'use strict';
define([
    'app',
], function (app) {
    app.factory('$organizationsService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.search = function () {
            return $http.post('/api/1.0/organizations'+ '?bust=' + (new Date()).getTime(), {}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updateDefaultSettings = function (org) {
            return $http.put('/api/1.0/organizations/' + org._id + '/defaultSettings'+ '?bust=' + (new Date()).getTime(), org.settings, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});