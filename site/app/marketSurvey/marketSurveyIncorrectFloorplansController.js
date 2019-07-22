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
            if ($scope.incorrectFpArray.changed || $scope.incorrectFpArray.message) {
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
        };

        $scope.removeFile = function() {
            $scope.incorrectFpArray.fileName = '';
            $scope.incorrectFpArray.file = '';
            $scope.incorrectFpArray.isUpload = false;
        }

        $scope.uploadFile = function(upload) {
            var allowedTypes = ["xlsx","docx","pdf","csv","txt"];
            var file = upload.files[0];
            var fileType = file.name.split('.').pop().toLowerCase();
            if(file.size < 20480000 && allowedTypes.includes(fileType)) {
                $scope.incorrectFpArray.fileName = file.name;
                var reader = new FileReader();
                reader.onload = function(){
                    $scope.incorrectFpArray.fileContents = reader.result.split(',')[1];
                    $scope.incorrectFpArray.isUpload = true;
                    $scope.incorrectFpArray.changed = true;
                };
                reader.readAsDataURL(file);
            } else {
                toastr.error("File should be less than 20 MB in size and in Excel, Word, PDF, CSV, or TXT format.");
            }
        };

        $scope.incorrectFloorplansTable = function () {
            $scope.removeFile();
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