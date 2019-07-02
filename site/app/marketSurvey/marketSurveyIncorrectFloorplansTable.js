"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplansTable", ["$scope", "$rootScope", "incorrectFpArray", "selectedProperty" , "$uibModalInstance", "$propertyService", "$dialog", "toastr", function ($scope, $rootScope, incorrectFpArray, selectedProperty , $uibModalInstance, $propertyService, $dialog, toastr) {
        ga("set", "title", "/IncorrectFloorplans");
        ga("set", "page", "/IncorrectFloorplans");
        ga("send", "pageview");

        $scope.incorrectFpArray = incorrectFpArray;
        $scope.selectedProperty = selectedProperty;
        $scope.incorrectFpArray.changed = false;

        $scope.cancel = function() {
            if ($scope.incorrectFpArray.changed) {
                $dialog.confirm("You have uploaded floor plans that have not been saved. Are you sure you want to close without saving?", function () {
                    $uibModalInstance.dismiss("cancel");
                }, function() {
                });
            } else {
                $uibModalInstance.dismiss("cancel");
            }
        };

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
            $scope.incorrectFpArray.floorplans = $scope.selectedProperty.floorplans;
            $scope.incorrectFpArray.submitted = true;
            console.log($scope.incorrectFpArray);
            $uibModalInstance.dismiss("cancel");
        };

    }]);
});