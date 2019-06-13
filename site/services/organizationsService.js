'use strict';
angular.module('biradix.global').factory('$organizationsService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.public = function (subdomain) {
            return $http.get(gAPI + "/org/" + subdomain + '?bust=' + (new Date()).getTime(), {
                }).success(function(response) {
                return response;
            }).error(function(response) {
                return response;
            });
        }

        fac.search = function () {
            return $http.post(gAPI + '/api/1.0/organizations'+ '?bust=' + (new Date()).getTime(), {}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updateDefaultSettings = function (org) {
            return $http.put(gAPI + '/api/1.0/organizations/' + org._id + '/defaultSettings'+ '?bust=' + (new Date()).getTime(), org.settings, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
