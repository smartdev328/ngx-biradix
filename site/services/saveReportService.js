angular.module('biradix.global').factory('$saveReportService', ['$http','$cookies', function ($http,$cookies) {
    var fac = {};

    fac.upsert = function (report) {
        return $http.post('/api/1.0/reporting/save/upsert'+ '?bust=' + (new Date()).getTime(), report, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    fac.update = function (report) {
        return $http.post('/api/1.0/reporting/save/update'+ '?bust=' + (new Date()).getTime(), report, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    fac.read = function () {
        return $http.get('/api/1.0/reporting/save'+ '?bust=' + (new Date()).getTime(), {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    fac.remove = function (reportId) {
        return $http.delete('/api/1.0/reporting/save/'+ reportId + '?bust=' + (new Date()).getTime(), {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    return fac;
}]);
