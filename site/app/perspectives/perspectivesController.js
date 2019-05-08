"use strict";
define([
    "app",
], function(app) {
    app.controller("perspectivesController", ["$scope", "$rootScope", "$perspectivesService", function($scope, $rootScope, $perspectivesService) {
        window.setTimeout(function() {
            window.document.title = "My Account - Perspectives | BI:Radix";
        }, 1500);

        $rootScope.sideNav = "Perspectives";
        $rootScope.sideMenu = true;

        $scope.MODE = {
            NONE: "none",
            ADD: "add",
            EDIT: "edit",
            VIEW: "view",
        };

        $scope.model = {
            selectedPerspective: null,
            name: "",
            selectedProperty: null,
            comps: null,
            mode: $scope.MODE.NONE
        };

        $scope.loading = true;
        $perspectivesService.scopeFunctions($scope);

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                var id = $rootScope.me.settings.defaultPropertyId;
                $scope.getPropertyById(id, function(properties) {
                    if (properties && properties.length) {
                        $scope.model.selectedProperty = properties[0];
                    }
                    $scope.loading = false;
                });

                me();
            }
        });

        $scope.$watch("model.selectedProperty", function(newP, oldP) {
            if (newP) {
                $scope.loading = true;
                $scope.loadComps(newP, function(newComps) {
                    $scope.model.comps = newComps;
                    if (newP._id.toString() === "5cc72e97545c3400152a6352") {
                        newP.perspectives = [{
                            name: "3 bedrooms",
                            comps: {
                                "5cc72e97545c3400152a6352": {
                                    floorplans: {
                                        "d6337940-6aa0-11e9-86cc-e7305abbdc07": true
                                    }
                                },
                                "5cc72e97545c3400152a6353": {
                                    floorplans: {
                                        "d6368682-6aa0-11e9-86cc-e7305abbdc07": true
                                    }
                                },
                                "5cc72e97545c3400152a6359": {
                                    floorplans: {
                                        "d63e9cd1-6aa0-11e9-86cc-e7305abbdc07": true
                                    }
                                }
                            }
                          }];
                    } else {
                        newP.perspectives = [];
                    }
                    $scope.loading = false;
                });
            }
        }, true);

        $scope.$watch("model.selectedPerspective", function(newP, oldP) {
            if (newP) {
                $scope.model.mode = $scope.MODE.EDIT;
                $scope.resetView($scope.model.comps);
                $scope.model.name = newP.name;
                var c;
                var f;
                $scope.model.comps.forEach(function(p) {
                    c = newP.comps[p._id.toString()];

                    p.floorplans.forEach(function(fp) {
                        if (c) {
                            f = c.floorplans[fp.id];
                            fp.checked = !!f;
                        } else {
                            fp.checked = false;
                        }
                    });
                });
                $scope.checkIndeterminate();
            }
        });

        $scope.add = function() {
            $scope.model.mode = $scope.MODE.ADD;
            $scope.model.name = "";
            $scope.resetView($scope.model.comps);
        };
    }]);
});
