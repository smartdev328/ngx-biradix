"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplansController", ["$scope", "$uibModal", "$rootScope", "$uibModalInstance", "$propertyService", "$incorrectFpService", "$dialog", "toastr", "ngProgress", "$httpHelperService", function ($scope, $uibModal, $rootScope, $uibModalInstance, $propertyService, $incorrectFpService, $dialog, toastr, ngProgress, $httpHelperService) {
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
            $scope.incorrectFpArray.propertyName = $scope.selectedProperty.name;
            ngProgress.start();
            $incorrectFpService.send($scope.selectedProperty._id, $scope.incorrectFpArray).then(function(response) {
                ngProgress.complete();
                $scope.incorrectFpArray.submitted = true;
            }).catch(function(err) {
                rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
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
                $scope.incorrectFpArray.fileContents = reader.result.split(',')[1];
                $scope.incorrectFpArray.isUpload = true;
            };
            reader.readAsDataURL(file);
        };

        $scope.incorrectFloorplansTable = function () {
            require([
                '/app/marketSurvey/marketSurveyIncorrectFloorplansTableController.js'
            ], function () {
                $uibModal.open({
                    templateUrl: '/app/marketSurvey/incorrectFloorplansTable.html?bust=' + version,
                    controller: 'marketSurveyIncorrectFloorplansTableController',
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