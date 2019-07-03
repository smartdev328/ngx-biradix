"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplansTable", ["$scope", "$rootScope", "incorrectFpArray", "selectedProperty" , "$uibModalInstance", "$incorrectFpService", "$dialog", "toastr", "ngProgress", "$httpHelperService", function ($scope, $rootScope, incorrectFpArray, selectedProperty , $uibModalInstance, $incorrectFpService, $dialog, toastr, ngProgress, $httpHelperService) {
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
            $scope.incorrectFpArray.propertyName = $scope.selectedProperty.name;
            $scope.incorrectFpArray.submitted = true;
            console.log($scope.incorrectFpArray);

            ngProgress.start();
            $incorrectFpService.send($scope.selectedProperty._id, $scope.incorrectFpArray).then(function(response) {
                // toastr.success($scope.model.name + " created successfully");
                ngProgress.complete();
            }).catch(function(err) {
                $httpHelperService.handleError(err);
                ngProgress.complete();
            });
            $uibModalInstance.dismiss("cancel");
        };

    }]);
});