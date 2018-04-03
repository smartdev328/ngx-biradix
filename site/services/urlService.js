angular.module("biradix.global").factory("$urlService", ["$http", "$cookies", function($http, $cookies) {
        var fac = {};

        fac.shorten = function(body) {
            var strReturn = "";

            var query = {
                query: "mutation StringShorten($body: String!) {StringShorten(body: $body, expiresInMinutes: 30)}",
                variables: {"body": body},
            };

            jQuery.ajax({
                type: "POST",
                contentType: "application/json",
                headers: {"Authorization": "Bearer " + $cookies.get("token")},
                data: JSON.stringify(query),
                url: "/graphql?bust=" + (new Date()).getTime(),
                success: function(html) {
                    strReturn = html.data.StringShorten;
                },
                async: false,
            });

            return strReturn;
        };

        return fac;
    }]);
