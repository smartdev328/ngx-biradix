angular.module("biradix.global").factory("$importIntegrationService", ["$http", "$cookies", function($http, $cookies) {
    var fac = {};

    fac.getLatestProperties = function(id) {
        return $http.get(gAPI + "/api/1.0/import/integrations/latestProperties?id=" + id + "&bust=" + (new Date()).getTime(), {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };


    fac.getLatestFloorplans = function(id, propertyId) {
        return $http.get(gAPI + "/api/1.0/import/integrations/latestFloorplans?id=" + id + "&propertyId=" + propertyId + "&bust=" + (new Date()).getTime(), {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    fac.getLatestFullYardi = function(propertyId) {
        return $http.get(gAPI + "/api/1.0/import/integrations/latestFullYardi/" + propertyId + "?bust=" + (new Date()).getTime(), {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    return fac;
}]);
