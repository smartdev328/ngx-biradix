'use strict';
define([
    'app',
    '../../services/cronService.js',
    '../../services/organizationsService.js',
], function (app) {
     app.controller
        ('defaultSettingsController', ['$scope', '$uibModalInstance', 'organization', 'ngProgress', '$rootScope','toastr','$cronService','$organizationsService', function ($scope, $uibModalInstance, organization, ngProgress, $rootScope, toastr,$cronService,$organizationsService) {

            ga('set', 'title', "/defaultSettings");
            ga('set', 'page', "/defaultSettings");
            ga('send', 'pageview');
            
            $scope.organization = organization;

            $scope.nots = $cronService.getOptions($scope.organization.settings.how_often.default_value);

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.save = function() {
                $scope.organization.settings.how_often.default_value = $cronService.getCron($scope.nots);

                ngProgress.start();
                $organizationsService.updateDefaultSettings($scope.organization).then(function (response) {
                    if (response.data.errors) {
                        toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                    }
                    else {
                        toastr.success('Default Settings Updated Successfully');
                    }
                    ngProgress.complete();
                }, function (response) {
                    toastr.error('Unable to update settings. Please contact an administrator');
                    ngProgress.complete();
                })
            }

    }]);

});