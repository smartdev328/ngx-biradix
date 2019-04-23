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

    fac.getFullYardi = function(propertyId, pmsId, floorplans, pricingStrategy) {
        return $http.post(gAPI + "/api/1.0/import/integrations/fullYardi/" + propertyId + "?bust=" + (new Date()).getTime(), {pmsId: pmsId, floorplans: floorplans, pricingStrategy: pricingStrategy}, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    return fac;
}]);
