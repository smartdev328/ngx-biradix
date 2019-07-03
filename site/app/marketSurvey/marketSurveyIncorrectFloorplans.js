"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplans", ["$scope", "$uibModal", "$rootScope", "$uibModalInstance", "$propertyService", "$incorrectFpService", "$dialog", "toastr", "ngProgress", "$httpHelperService", function ($scope, $uibModal, $rootScope, $uibModalInstance, $propertyService, $incorrectFpService, $dialog, toastr, ngProgress, $httpHelperService) {
        ga("set", "title", "/IncorrectFloorplans");
        ga("set", "page", "/IncorrectFloorplans");
        ga("send", "pageview");

        $scope.incorrectFpArray = {
            submitted: false,
            isUpload: false
        };

        $scope.cancel = function() {
            if ($scope.incorrectFpArray.fileName || $scope.incorrectFpArray.message) {
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
            }
            else if (!id) {
                $scope.selectedProperty = $scope.myProperties[0];
            } else {
                $scope.selectedProperty = _.find($scope.myProperties, function (x) {
                    return x._id.toString() == id;
                })
            }

        }, function(error) {
            $httpHelperService.handleError(error);
            $scope.apiError = true;
        });

        $scope.done = function() {
            $scope.incorrectFpArray.submitted = true;
            $scope.incorrectFpArray.propertyName = $scope.selectedProperty.name;
            console.log($scope.incorrectFpArray);
            ngProgress.start();
            $incorrectFpService.send($scope.selectedProperty._id, $scope.incorrectFpArray).then(function(response) {
                // toastr.success($scope.model.name + " created successfully");
                ngProgress.complete();
            }).catch(function(err) {
                $httpHelperService.handleError(err);
                ngProgress.complete();
            });
        };

        $scope.removeFile = function() {
            $scope.incorrectFpArray.fileName = '';
            $scope.incorrectFpArray.file = '';
        }

        $scope.uploadFile = function(upload) {
            var file = upload.files[0];
            $scope.incorrectFpArray.fileName = file.name;
            var reader = new FileReader();
            reader.onload = function(){
                $scope.incorrectFpArray.fileContents = reader.result;
                $scope.incorrectFpArray.isUpload = true;
            };
            reader.readAsDataURL(file);
        };

        $scope.incorrectFloorplansTable = function () {
            require([
                '/app/marketSurvey/marketSurveyIncorrectFloorplansTable.js'
            ], function () {
                $uibModal.open({
                    templateUrl: '/app/marketSurvey/incorrectFloorplansTable.html?bust=' + version,
                    controller: 'marketSurveyIncorrectFloorplansTable',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        incorrectFpArray: function () {
                            return  $scope.incorrectFpArray;
                        },
                        selectedProperty: function () {
                            return  $scope.selectedProperty;
                        }
                    }
                });
            });
        }

    }]);
});