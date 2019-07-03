angular.module("biradix.global").factory('$incorrectFpService', ['$http', "$httpHelperService", function ($http, $httpHelperService, $cookies) {
    var fac = {};

    fac.send = function (propertyId, incorrectFp) {
        return $http.put(gAPI + '/api/1.0/properties/incorrectFp/' + propertyId + "?bust=" + (new Date()).getTime(), incorrectFp, {
            headers: $httpHelperService.authHeader()})
            .success(function(response) {
                return response;
            })
            .error(function(response) {
                return response;
        });
    }

    return fac;
}]);