"use strict";
define([
    "app"
], function(app) {
    app.controller("pmsSetupController", ["$scope", "$uibModalInstance", "property", "ngProgress", "$propertyService", "$importService", "$importIntegrationService", "toastr", "$dialog", "$rootScope",
        function($scope, $uibModalInstance, property, ngProgress, $propertyService, $importService, $importIntegrationService, toastr, $dialog, $rootScope) {
            ga("set", "title", "/pmsSetup");
            ga("set", "page", "/pmsSetup");
            ga("send", "pageview");

            $scope.pms = {
                selectedProperty: null,
                config: null,
            };
            $scope.cancel = function() {
                $uibModalInstance.dismiss("cancel");
            };

            $scope.reload = function() {
                $scope.loaded = false;
                $propertyService.search({
                    limit: 1,
                    permission: ["PropertyManage"],
                    ids: [property._id],
                    select: "_id floorplans orgid pms name",
                }).then(function(response) {
                    $scope.property = response.data.properties[0]
                    $scope.pms.config = property.pms;
                    // TODO: When this becomes client facing, we cannot return all integration client side
                    $importService.read().then(function(response) {
                        $scope.imports = _.filter(response.data, function(i) {
                            return i.orgid.toString() === $scope.property.orgid.toString();
                        });

                        if ($scope.imports.length === 1) {
                            $importIntegrationService.getLatestProperties($scope.imports[0].id).then(function(response) {
                                $scope.properties = response.data;

                                if (!$scope.pms.config) {
                                    $scope.pms.selectedProperty = _.find($scope.properties, function(p) {
                                       return p.name === $scope.property.name;
                                    });
                                }
                                $scope.loaded = true;
                            });
                        }
                    });
                });
            };

            $scope.connect = function() {
                var pms = {
                    imortId: $scope.imports[0].id,
                    importProvider: $scope.imports[0].provider,
                    yardi: {
                        propertyId: $scope.pms.selectedProperty.id,
                        floorplans: []
                    }
                };
                console.log(pms);
            };

            $scope.reload();
        }]);

});
