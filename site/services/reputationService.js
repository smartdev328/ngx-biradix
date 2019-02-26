angular.module("biradix.global").factory("$reputationService", ["$http", "$cookies",
    function($http, $cookies) {
    var fac = {};

    fac.searchYelp = function(term, location, limit) {
        return $http.post(gAPI + "/api/1.0/yelp/search"+ "?bust=" + (new Date()).getTime(),
            {
                term: term,
                location: location,
                limit: limit
            }, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    return fac;
}]);
