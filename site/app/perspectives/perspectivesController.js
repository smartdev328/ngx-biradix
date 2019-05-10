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
                            excluded_floorplans: [
                                {
                                    propertyId: "5cc72e97545c3400152a6352",
                                    floorplanId: "d6337940-6aa0-11e9-86cc-e7305abbdc07"
                                },
                                {
                                    propertyId: "5cc72e97545c3400152a6353",
                                    floorplanId: "d6368682-6aa0-11e9-86cc-e7305abbdc07"
                                },
                                {
                                    propertyId: "5cc72e97545c3400152a6359",
                                    floorplanId: "d63e9cd1-6aa0-11e9-86cc-e7305abbdc07"
                                },
                            ]
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
                $scope.model.mode = $scope.MODE.VIEW;
                $scope.resetView($scope.model.comps);
                $scope.model.name = newP.name;
                var f;
                $scope.model.comps.forEach(function(p) {
                    p.floorplans.forEach(function(fp) {
                        f = _.find(newP.excluded_floorplans, function(x) {
                            return x.propertyId.toString() === p._id.toString() && x.floorplanId.toString() === fp.id.toString();
                        });
                        console.log(f);
                        fp.checked = !f;
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
