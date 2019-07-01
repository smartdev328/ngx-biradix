"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplansTable", ["$scope", "$rootScope", "$uibModalInstance", "$propertyService", "$dialog", "toastr", function ($scope, $rootScope, $uibModalInstance, $propertyService, $dialog, toastr) {
        ga("set", "title", "/IncorrectFloorplans");
        ga("set", "page", "/IncorrectFloorplans");
        ga("send", "pageview");

        $scope.cancel = function() {
            if (false) {
                $dialog.confirm("You have uploaded floor plans that have not been saved. Are you sure you want to close without saving?", function () {
                    $uibModalInstance.dismiss("cancel");
                }, function() {
                });
            } else {
                $uibModalInstance.dismiss("cancel");
            }
        };

        $propertyService.search({
            limit: 20,
            permission: 'PropertyManage',
            active: true,
            select: "name floorplans",
            skipAmenities: true
        }).then(function (response) {
            $scope.myProperties = response.data.properties;
            var id = $rootScope.me.settings.defaultPropertyId;

            if (!$scope.myProperties || $scope.myProperties.length == 0) {
                id = null;
            } else if (!id) {
                $scope.selectedProperty = $scope.myProperties[0];
            } else {
                $scope.selectedProperty = _.find($scope.myProperties, function (x) {
                    return x._id.toString() == id;
                })
            }

        }, function(error) {
            if (error.status == 401) {
                $rootScope.logoff();
                return;
            }

            rg4js('send', new Error("User saw API unavailable error alert/message/page"));
            $scope.apiError = true;
        });

        $scope.addEmptyRow = function() {
            $scope.selectedProperty.floorplans.push({
                bathrooms: "",
                bedrooms: "",
                description: "",
                sqft: "",
                units: ""
            });
        }

        $scope.deleteRow = function(i) {
            $scope.selectedProperty.floorplans.splice(i, 1);
        }

        $scope.done = function() {
            $scope.incorrectFpArray = {
                floorplans: $scope.selectedProperty
            }
            $uibModalInstance.dismiss("cancel");
        };

    }]);
});