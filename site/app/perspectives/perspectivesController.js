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
            workablePerspective: null,
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

        $scope.add = function() {
            $scope.model.mode = $scope.MODE.ADD;
            $scope.model.workablePerspective = {
                name: "",
            };
        };

        $scope.$watch("model.selectedProperty", function(newP, oldP) {
            if (newP) {
                $scope.loading = true;
                $scope.loadComps(newP, function(newComps) {
                    $scope.model.comps = newComps;
                    $scope.loading = false;
                });
            }
        }, true);

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

        $scope.checkIndeterminate = function() {
            var bedroomOn;
            var bedroomOff;
            var compOn;
            var compOff;
            $scope.model.comps.forEach(function(p) {
                compOff = false;
                compOff = false;
                p.bedrooms.forEach(function(b) {
                    bedroomOn = false;
                    bedroomOff = false;
                    b.floorplans.forEach(function(f) {
                        if (f.checked) {
                            bedroomOn = true;
                            compOn = true;
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
    }]);
});
