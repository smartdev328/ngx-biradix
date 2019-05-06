angular.module("biradix.global").factory("$perspectivesService", ["$http", "$cookies", "$q", "$propertyService", "$rootScope", function($http, $cookies, $q, $propertyService, $rootScope) {
        var fac = {};

        fac.scopeFunctions = function($scope) {
            $scope.autocompleteproperties = function(search, callback) {
                $propertyService.search({
                    limit: 100,
                    permission: ["PropertyManage"],
                    active: true,
                    searchName: search,
                    skipAmenities: true,
                    hideCustomComps: true,
                    select: "name comps.id custom",
                    sort: "name"
                }).then(function(response) {
                    response.data.properties = _.sortBy(response.data.properties, function(x) {
                        return x.name;
                    });
                    response.data.properties.forEach(function(p) {
                        p.isCustom = !!(p.custom && p.custom.owner);
                    });

                    callback(response.data.properties);
                }, function(error) {
                    callback([]);
                });
            };

            $scope.searchAsync = function(term) {
                var deferred = $q.defer();

                $scope.autocompleteproperties(term, function(result) {
                    result = _.sortByOrder(result, ["isCustom", "name"], [false, true]);
                    var found = {};
                    result.forEach(function(r) {
                        if (r.isCustom) {
                            if (!found["My Custom Properties"]) {
                                r.group = "My Custom Properties";
                                found["My Custom Properties"] = true;
                            }
                        } else {
                            if (!found[$rootScope.me.orgs[0].name + " Properties"]) {
                                r.group = $rootScope.me.orgs[0].name + " Properties";
                                found[$rootScope.me.orgs[0].name + " Properties"] = true;
                            }
                        }
                    });
                    deferred.resolve(result);
                });

                return deferred.promise;
            };            
        };

        return fac;
    }]);
