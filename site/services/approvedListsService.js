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

        return $http.post("/graphql"+ "?bust=" + (new Date()).getTime(), query, {
            headers: {}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    fac.create = function(approvedListItem) {
        var query = {
            query: "mutation ApprovedListItemCreate($approvedListItem: ApprovedListItemWrite) {ApprovedListItemCreate(approvedListItem: $approvedListItem) {value}}",
            variables: {"approvedListItem": approvedListItem},
        };

        return $http.post("/graphql"+ "?bust=" + (new Date()).getTime(), query, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    return fac;
}]);
