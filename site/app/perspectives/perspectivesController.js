"use strict";
define([
    "app",
], function(app) {
    var pageViewType = 'InitialPageView';

    app.controller("perspectivesController", ["$scope", "$rootScope", "$perspectivesService", "toastr", "$httpHelperService", "ngProgress", "$dialog", "$cookieSettingsService", "$stateParams",
        function($scope, $rootScope, $perspectivesService, toastr, $httpHelperService, ngProgress, $dialog, $cookieSettingsService, $stateParams) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }
        
        window.setTimeout(function() {
            window.document.title = "My Account - Perspectives | Radix";
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
        $perspectivesService.scopeFunctions($scope);

        $scope.sortPerspective = function( perspective ) {
            return perspective.name.toLowerCase();
        };

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                var id = $rootScope.me.settings.defaultPropertyId;
                if ($stateParams.prId) {
                    id = $stateParams.prId;
                }
                var pId = $cookieSettingsService.getPerspective();
                if ($stateParams.pId) {
                    pId = $stateParams.pId;
                }
                $scope.loadPerspective(id, pId, true);
                me();
            }
        });

        $scope.loadPerspective = function(propertyId, perspectiveId, fireGa) {
            $scope.getPropertyById(propertyId, function(properties) {
                if (properties && properties.length) {
                    $scope.model.selectedProperty = properties[0];
                    $scope.perspectiveToLoad = perspectiveId;
                }
                $scope.loading = false;

                if (fireGa && ga && pageViewType && timeStart && performance && performance.now) {
                    var pageTime = performance.now() - timeStart;

                    var metrics = pageViewType === 'InitialPageView' && {
                        'metric1': 1,
                        'metric2': pageTime,
                    } || {
                        'metric3': 1,
                        'metric4': pageTime,
                    }
            
                    ga('send', 'event', pageViewType, 'Perspectives', metrics);
            
                    pageViewType = 'PageView';
                }
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
                    });
                });
                $scope.checkIndeterminate();
            }
        });

        $scope.model.changed = false;

        $scope.changesComplete = function() {
            $scope.model.changed = false;
            $rootScope.globalConfirm = "";
        }

        $scope.changesMade = function() {
            $scope.model.changed = true;
            $rootScope.globalConfirm = "You have made changes that have not been saved. Are you sure you want to leave without saving?";
        };

        $scope.edit = function() {
            $scope.model.mode = $scope.MODE.EDIT;
            $scope.model.originalPerspective = _.cloneDeep($scope.model.selectedPerspective);
        };

        $scope.cancel = function () {

            if ($scope.model.changed) {
                $dialog.confirm($rootScope.globalConfirm, function () {
                    if($scope.model.selectedPerspective) {
                        $scope.model.selectedPerspective = $scope.model.originalPerspective;
                        $scope.model.mode = $scope.MODE.VIEW;
                    } else {
                        $scope.model.mode = $scope.MODE.NONE;
                    }
                    $scope.changesComplete();
                }, function () {
                });
            }
            else {
                if($scope.model.selectedPerspective) {
                    $scope.model.selectedPerspective = $scope.model.originalPerspective;
                    $scope.model.mode = $scope.MODE.VIEW;
                } else {
                    $scope.model.mode = $scope.MODE.NONE;
                }
                $scope.changesComplete();
            }

        };

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
                    $scope.changesComplete();
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
                var perspective = response.data;
                $scope.loadPerspective($scope.model.selectedProperty._id, perspective.id);
                $scope.changesComplete();
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
                $scope.changesComplete();
            }).catch(function(err) {
                $httpHelperService.handleError(err);
                $scope.processing = false;
                ngProgress.complete();
            });
        }
    }]);
});
