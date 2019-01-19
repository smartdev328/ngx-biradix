angular.module("biradix.global").factory("$auditService", ["$http", "$cookies", function($http, $cookies) {
    var fac = {};

    fac.filters = function () {
        return $http.get(gAPI + "/api/1.0/audit/filters"+ "?bust=" + (new Date()).getTime(), {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    }

    fac.search = function (criteria) {
        return $http.post(gAPI + "/api/1.0/audit"+ "?bust=" + (new Date()).getTime(), criteria, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function (response) {
            return response;
        }).error(function(response) {
            return response;
        });
    }

    fac.create = function (audit) {
        return $http.put(gAPI + "/api/1.0/audit"+ "?bust=" + (new Date()).getTime(), audit, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    }

    fac.undo = function (id) {
        return $http.post(gAPI + "/api/1.0/audit/undo"+ "?bust=" + (new Date()).getTime(), {id: id}, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    }

    fac.approve = function(id) {
        return $http.post(gAPI + "/api/1.0/audit/approve"+ "?bust=" + (new Date()).getTime(), {id: id}, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    }

    return fac;
}]);
