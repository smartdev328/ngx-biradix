'use strict';
define([
    'app',
    '../../services/userService.js',
    '../../services/propertyService.js',
    '../../services/propertyUsersService.js',
], function (app) {
     app.controller
        ('surveySwapController', ['$scope', '$uibModalInstance', 'property', '$userService', 'ngProgress','$propertyService','$propertyUsersService','toastr', function ($scope, $uibModalInstance, property, $userService, ngProgress,$propertyService,$propertyUsersService,toastr) {

            $scope.property = property;

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            ga('set', 'title', "/surveySwap");
            ga('set', 'page', "/surveySwap");
            ga('send', 'pageview');


            $scope.newGuest = '';

            $scope.loading = true;

            $propertyUsersService.getPropertyAssignedGuests(property._id).then(function (response) {

                    $scope.users = response.data.users;
                    $scope.loading = false;

                },
                function (error) {
                    toastr.error("Unable to retrieve data. Please contact the administrator.");
                    $scope.loading = false;
                });


        }]);
});