
'use strict';
define(['app'], function (app) {
    app.factory('$reportingService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.reports = function(compids, subjectid, reports) {
            return $http.post('/api/1.0/reporting/' + subjectid + '?bust=' + (new Date()).getTime(), {
                compids: compids,
                reports: reports,
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.reportsGroup = function(propertyids, reports) {
            return $http.post('/api/1.0/reporting/group'+ '?bust=' + (new Date()).getTime(), {
                propertyids: propertyids,
                reports: reports,
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});
