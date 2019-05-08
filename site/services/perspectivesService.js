angular.module("biradix.global").factory("$perspectivesService", ["$http", "$cookies", "$q", "$propertyService", "$rootScope", function($http, $cookies, $q, $propertyService, $rootScope) {
        var fac = {};

        fac.scopeFunctions = function($scope) {
            $scope.loadComps = function(property, callback) {
                var compIds = property.comps.map(function(c) {
                    return c.id;
                });

                $propertyService.search({
                    limit: 10000,
                    permission: "PropertyView",
                    active: true,
                    select: "_id name floorplans",
                    ids: compIds,
                    sort: "name",
                    skipAmenities: true
                }).then(function(response) {
                    var comp;
                    response.data.properties.forEach(function(c) {
                        comp = _.find(property.comps, function(x) {
                            return x.id.toString() === c._id.toString();
                        });

                        c.orderNumber = 999;

                        if (comp && typeof comp.orderNumber != "undefined") {
                            c.orderNumber = comp.orderNumber;
                        }

                        if (comp.id.toString() === property._id.toString()) {
                            c.orderNumber = -1;
                        }
                    });
                    response.data.properties = _.sortByAll(response.data.properties, ["orderNumber", "name"]);

                    var temp;
                    response.data.properties.forEach(function(p) {
                        p.open = true;
                        p.checked = true;
                        p.indeterminate = false;
                        p.bedrooms = [];
                        p.floorplans.forEach(function(fp) {
                            fp.checked = true;
                            temp = _.find(p.bedrooms, function(b) {
                                return b.number === Math.floor(fp.bedrooms);
                            });
                            if (temp) {
                                temp.floorplans = temp.floorplans || [];
                                temp.floorplans.push(fp);
                            } else {
                                p.bedrooms.push({
                                    open: true,
                                    checked: true,
                                    indeterminate: false,
                                    number: Math.floor(fp.bedrooms),
                                    floorplans: [fp]
                                });
                            }
                        });
                    });
                    callback(response.data.properties);
                });
            };

            $scope.getPropertyById = function(id, callback) {
                $propertyService.search({
                    limit: 100,
                    permission: ["PropertyManage"],
                    active: true,
                    ids: id ? [id] : undefined,
                    skipAmenities: true,
                    hideCustomComps: true,
                    select: "name comps.id comps.orderNumber custom",
                    sort: "name"
                }).then(function(response) {
                    callback(response.data.properties);
                }, function(error) {
                    callback([]);
                });
            };

            $scope.autocompleteproperties = function(search, callback) {
                $propertyService.search({
                    limit: 100,
                    permission: ["PropertyManage"],
                    active: true,
                    searchName: search,
                    skipAmenities: true,
                    hideCustomComps: true,
                    select: "name comps.id comps.orderNumber custom",
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
