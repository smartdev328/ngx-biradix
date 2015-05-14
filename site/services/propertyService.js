'use strict';
define(['app'], function (app) {
    app.factory('$propertyService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};


        fac.search = function (criteria) {
            return $http.post('/api/1.0/properties', criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }



        return fac;
    }]);
});