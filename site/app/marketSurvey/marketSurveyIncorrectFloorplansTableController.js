"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplansTableController", ["$scope", "$rootScope", "incorrectFpArray", "selectedProperty" , "$uibModalInstance", "$incorrectFpService", "$dialog", "toastr", "ngProgress", "$httpHelperService", function ($scope, $rootScope, incorrectFpArray, selectedProperty , $uibModalInstance, $incorrectFpService, $dialog, toastr, ngProgress, $httpHelperService) {
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

        $scope.addEmptyRow();

        $scope.incorrectFpArray.keyPress = function(row) {
            incorrectFpArray.changed = true;
            if(row) {
                $scope.addEmptyRow();
            }
        }

        $scope.deleteRow = function(i) {
            $scope.selectedProperty.floorplans.splice(i, 1);
        }

        $scope.showAllFP = function() {
            $scope.allShown = !$scope.allShown;
        }

        $scope.done = function() {
            $scope.incorrectFpArray.floorplans = $scope.selectedProperty.floorplans;
            $scope.incorrectFpArray.propertyName = $scope.selectedProperty.name;
            $scope.incorrectFpArray.changed = false;

            ngProgress.start();
            $incorrectFpService.send($scope.selectedProperty._id, $scope.incorrectFpArray).then(function(response) {
                ngProgress.complete();
                $scope.incorrectFpArray.submitted = true;
                $scope.incorrectFpArray.message = "";
            }).catch(function(err) {
                rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                ngProgress.complete();
            });
            $uibModalInstance.dismiss("cancel");
        };

    }]);
});