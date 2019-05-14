angular.module("biradix.global").factory("$perspectivesService", ["$http", "$cookies", "$q", "$propertyService", "$rootScope", "$httpHelperService", function($http, $cookies, $q, $propertyService, $rootScope, $httpHelperService) {
        var fac = {};

        fac.scopeFunctions = function($scope) {
            $scope.selectPerspective = function(id) {
                $scope.model.selectedProperty.perspectives =  $scope.model.selectedProperty.perspectives || [];
                if ($scope.model.selectedProperty.perspectives.length > 0) {
                    if (!id) {
                        $scope.model.selectedPerspective = $scope.model.selectedProperty.perspectives[0];
                    } else {
                        $scope.model.selectedPerspective = _.find($scope.model.selectedProperty.perspectives, function(p) {
                            return p.id.toString() === id.toString();
                        });
                    }
                }
            };

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

                    $scope.resetView(response.data.properties);

                    callback(response.data.properties);
                });
            };

            $scope.resetView = function(properties) {
                var temp;
                properties.forEach(function(p) {
                    p.open = true;
                    p.checked = true;
                    p.indeterminate = false;
                    p.bedrooms = [];
                    p.selectedFloorplans = p.floorplans.length;
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
            };

            $scope.getPropertyById = function(id, callback) {
                $propertyService.search({
                    limit: 100,
                    permission: ["PropertyManage"],
                    active: true,
                    ids: id ? [id] : undefined,
                    skipAmenities: true,
                    hideCustomComps: true,
                    select: "name comps.id comps.orderNumber custom perspectives",
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

            $scope.propertyChecked = function(property) {
                property.indeterminate = false;
                property.bedrooms.forEach(function(b) {
                    b.checked = property.checked;
                    b.indeterminate = false;
                    $scope.bedroomChecked(b, false);
                });
                $scope.checkIndeterminate();
            };

            $scope.bedroomChecked = function(bedroom, checkIndeterminate) {
                bedroom.floorplans.forEach(function(f) {
                    f.checked = bedroom.checked;
                });
                if (checkIndeterminate) {
                    $scope.checkIndeterminate();
                }
            };

            $scope.getExlcudedFloorplans = function() {
                var excludedFloorplans = [];
                $scope.model.comps.forEach(function(p) {
                    p.floorplans.forEach(function(fp) {
                        if (!fp.checked) {
                            excludedFloorplans.push({propertyId: p._id.toString(), floorplanId: fp.id});
                        }
                    })
                });

                return excludedFloorplans;
            }

            $scope.checkIndeterminate = function() {
                var bedroomOn;
                var bedroomOff;
                var compOn;
                var compOff;
                $scope.model.comps.forEach(function(p) {
                    compOff = false;
                    compOff = false;
                    p.selectedFloorplans = 0;
                    p.bedrooms.forEach(function(b) {
                        bedroomOn = false;
                        bedroomOff = false;
                        b.floorplans.forEach(function(f) {
                            if (f.checked) {
                                bedroomOn = true;
                                compOn = true;
                                p.selectedFloorplans++;
                            } else {
                                bedroomOff = true;
                                compOff = true;
                            }
                        });

                        b.indeterminate = false;
                        if (bedroomOn && bedroomOff) {
                            b.checked = false;
                            b.indeterminate = true;
                        } else if (bedroomOn) {
                            b.checked = true;
                        } else {
                            b.checked = false;
                        }
                    });
                    p.indeterminate = false;
                    if (compOn && compOff) {
                        p.checked = false;
                        p.indeterminate = true;
                    } else if (compOn) {
                        p.checked = true;
                    } else {
                        p.checked = false;
                    }
                });
            };
        };

        fac.create = function(propertyId, perspective) {
            return $http.put(gAPI + '/api/1.0/properties/perspectives/' + propertyId + "?bust=" + (new Date()).getTime(), perspective, {
                headers: $httpHelperService.authHeader()})
                .success(function(response) {
                    return response;
                })
                .error(function(response) {
                    return response;
            });
        };

        return fac;
    }]);
