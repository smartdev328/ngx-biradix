'use strict';
angular.module('biradix.global').factory('$mediaService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.uploadImage = function (upload) {
            return $http.post('/api/1.0/media/images'+ '?bust=' + (new Date()).getTime(), upload, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }
    return fac;
}]);