angular.module("biradix.global").factory("$importService", ["$http", "$cookies", function($http, $cookies) {
    var fac = {};

    fac.read = function() {
        return $http.get(gAPI + "/api/1.0/import"+ "?bust=" + (new Date()).getTime(), {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    return fac;
}]);
