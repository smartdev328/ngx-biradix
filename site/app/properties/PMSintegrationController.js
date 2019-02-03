'use strict';
define([
    'app'
], function (app) {
     app.controller
    ('PMSintegrationController', ['$scope', '$uibModalInstance', 'property', '$userService', 'ngProgress','$propertyService','$propertyUsersService','toastr','$dialog', "$rootScope", "$keenService", "$authService", function ($scope, $uibModalInstance, property, $userService, ngProgress,$propertyService,$propertyUsersService,toastr,$dialog, $rootScope, $keenService, $authService) {
        $scope.property = property;

        $scope.pmsData = {
            using:"Select",
            id:"",
            directoryPath:"/alliance/",
            connected:false,
            floorPlansImported:false
        }

        $scope.cancel = function () {
            if (($scope.pmsData.using == "Yardi" && !$scope.pmsData.id && $scope.pmsData.directoryPath == "/alliance/") || $scope.pmsData.using == "Select") {
                $uibModalInstance.dismiss("cancel");
            } else {
                $dialog.confirm("It appears you are in the middle of integrating a PMS. Do you want to close without saving it?", function() {
                    $uibModalInstance.dismiss("cancel");
                });
            }
        };

        $scope.next = function () {
            if ($scope.pmsData.using == "Yardi" && !$scope.pmsData.id && $scope.pmsData.directoryPath == "/alliance/") {
                $uibModalInstance.dismiss("cancel");
            } else if(!$scope.pmsData.id) {
                toastr.error("Please enter the Yardi property code");
            } else if($scope.pmsData.directoryPath == "/alliance/") {
                toastr.error("Please specify ftp import directory");
            } else if($scope.pmsData.directoryPath == "/alliance/true") {
                toastr.success($scope.property.name + " is now connected to Yardi!");
                $scope.pmsData.connected = true;
            } else {
                toastr.error("Sorry, it appears the floor plans in your PMS are different than what is in BI:Radix.<br/>Please confirm that the BI:Radix floor plans match what is in your PMS in terms of bedrooms, bathrooms, unit count, and square footage");
            }
        };

        $scope.disconnect = function() {
            $dialog.confirm("Are you sure you want to disconnect from your PMS?", function() {
                toastr.error($scope.property.name + " is now disconnected from Yardi!");
                $scope.pmsData.connected = false;
                $uibModalInstance.dismiss("cancel");
            });
        }

        $scope.import = function() {
            $dialog.confirm("Are you sure you want to overwrite any existing floor descriptions with those from your PMS?", function() {
                toastr.success("Floor Plan descriptions for " + $scope.property.name + " have been imported from Yardi!");
                $scope.pmsData.floorPlansImported = true;
            });
        }

        $scope.done = function() {
            if(!$scope.pmsData.floorPlansImported) {
                $dialog.confirm("Are you sure you want to exit without importing the floor descriptions from your PMS?", function() {
                    $uibModalInstance.dismiss("cancel");
                });
            } else {
                $uibModalInstance.dismiss("cancel");
            }
        }

    }]);
});