angular.module("biradix.global").factory("$keenService", ["$http", "$cookies", function($http, $cookies) {
        var fac = {};

        fac.record = function(event) {
            return $http.put("/api/1.0/keen"+ "?bust=" + (new Date()).getTime(), event, {
                headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
                return response;
            }).error(function(response) {
                return response;
            });
        };

        return fac;
    }]);
