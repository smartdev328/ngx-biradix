angular.module("biradix.global").factory("$approvedListsService", ["$http", "$cookies", function($http,$cookies) {
    var fac = {};

    fac.read = function(criteria) {
        var query = {
            query: "query Approved($criteria: ApprovedListSearchCriteria) {\n" +
                "  ApprovedList(criteria: $criteria) {\n" +
                "    id\n" +
                "    value\n" +
                "    type\n" +
                "    searchable\n"+
                "  }\n" +
                "}\n",
            variables: {"criteria": criteria},
        };

        return $http.post(gAPI + "/graphql"+ "?bust=" + (new Date()).getTime(), query, {
            headers: {}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    return fac;
}]);
