angular.module("biradix.global").factory("$keenService", ["$http", "$cookies", function($http, $cookies) {
    var fac = {};

    fac.record = function(event) {
        return $http.put(gAPI + "/api/1.0/keen"+ "?bust=" + (new Date()).getTime(), event, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    fac.query = function(analysis, parameters) {
        return $http.post(gAPI + "/api/1.0/keen"+ "?bust=" + (new Date()).getTime(), {analysis: analysis, parameters: parameters}, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    fac.daterangeToTtimeframe = function(daterange) {
        return {
            start: moment(daterange.selectedStartDate).format(),
            end: moment(daterange.selectedEndDate).format(),
        };
    };

    fac.daterangeToInterval = function(daterange) {
        var s = moment(daterange.selectedStartDate);
        var e = moment(daterange.selectedEndDate);

        var d = Math.abs(s.diff(e, "days"));

        if (d >= 720) {
            return "monthly";
        }
        if (d > 30) {
            return "weekly";
        }

        return "daily";
    };

    return fac;
}]);
