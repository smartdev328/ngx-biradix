"use strict";
define([
    "app",
], function(app) {
    app.controller("perspectivesController", ["$scope", "$rootScope", "$perspectivesService", "toastr", "$httpHelperService", "ngProgress", "$dialog", "$cookieSettingsService", function($scope, $rootScope, $perspectivesService, toastr, $httpHelperService, ngProgress, $dialog, $cookieSettingsService) {
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
        $scope.processing = false;
        $scope.hasHistory = false;
        $scope.showHistory = true;
        $perspectivesService.scopeFunctions($scope);

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                var id = $rootScope.me.settings.defaultPropertyId;
                $scope.loadPerspective(id, $cookieSettingsService.getPerspective());
                me();
            }
        });

        $scope.loadPerspective = function(propertyId, perspectiveId) {
            $scope.getPropertyById(propertyId, function(properties) {
                if (properties && properties.length) {
                    $scope.model.selectedProperty = properties[0];
                    $scope.perspectiveToLoad = perspectiveId;
                }
                $scope.loading = false;
            });
        };

        $scope.$watch("model.selectedProperty", function(newP, oldP) {
            if (newP) {
                $scope.loading = true;
                $scope.loadComps(newP, function(newComps) {
                    $scope.model.comps = newComps;
                    if ($scope.perspectiveToLoad) {
                        $scope.selectPerspective($scope.perspectiveToLoad);
                        delete $scope.perspectiveToLoad;
                    } else {
                        $scope.model.selectedPerspective = null;
                        $scope.model.mode = $scope.MODE.NONE;
                    }
                    $scope.loading = false;
                    $scope.hasHistory = false;
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
                        f = _.find(newP.excludedFloorplans, function(x) {
                            return x.propertyId.toString() === p._id.toString() && x.floorplanId.toString() === fp.id.toString();
                        });
                        fp.checked = !f;
                        _.find(p.floorplans, function(fp){ 
                            if(fp.deleted) {
                                $scope.hasHistory = true;
                            } 
                        });
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

        $scope.delete = function() {
            $dialog.confirm("Are you sure you want to delete the <b>" + $scope.model.name + "</b> Perspective?", function () {
                $scope.processing = true;
                ngProgress.start();
                $perspectivesService.delete($scope.model.selectedProperty._id, $scope.model.selectedPerspective.id).then(function(response) {
                    toastr.warning($scope.model.name + " deleted successfully");
                    $scope.processing = false;
                    ngProgress.complete();
                    $scope.loadPerspective($scope.model.selectedProperty._id, null);
                    $scope.model.selectedPerspective = null;
                    $scope.model.mode = $scope.MODE.NONE;
                }).catch(function(err) {
                    $httpHelperService.handleError(err);
                    $scope.processing = false;
                    ngProgress.complete();
                });
            });
        };

        $scope.create = function() {
            $scope.processing = true;
            ngProgress.start();
            $perspectivesService.create($scope.model.selectedProperty._id, {name: $scope.model.name, excludedFloorplans: $scope.getExlcudedFloorplans()}).then(function(response) {
                toastr.success($scope.model.name + " created successfully");
                $scope.processing = false;
                ngProgress.complete();
                $scope.loadPerspective($scope.model.selectedProperty._id, response.data.id);
                var perspective = response.data;
                $scope.model.selectedProperty.perspectives = $scope.model.selectedProperty.perspectives || [];
                $scope.model.selectedProperty.perspectives.push(perspective);
                $scope.model.selectedPerspective = perspective;
            }).catch(function(err) {
                $httpHelperService.handleError(err);
                $scope.processing = false;
                ngProgress.complete();
            });
        }

        $scope.update = function() {
            $scope.processing = true;
            ngProgress.start();
            $perspectivesService.update($scope.model.selectedProperty._id, {id: $scope.model.selectedPerspective.id, name: $scope.model.name, excludedFloorplans: $scope.getExlcudedFloorplans()}).then(function(response) {
                toastr.success($scope.model.name + " updated successfully");
                $scope.processing = false;
                ngProgress.complete();
                $scope.loadPerspective($scope.model.selectedProperty._id, response.data.id);
                $scope.model.mode = $scope.MODE.VIEW;
            }).catch(function(err) {
                $httpHelperService.handleError(err);
                $scope.processing = false;
                ngProgress.complete();
            });
        }
    }]);
});
