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




            $scope.reload = function() {
                $scope.newGuest = {};
                $scope.loading = true;


                $propertyUsersService.getPropertyAssignedGuests(property._id).then(function (response) {

                        $scope.users = response.data.users;
                        $scope.loading = false;

                    },
                    function (error) {
                        toastr.error("Unable to retrieve data. Please contact the administrator.");
                        $scope.loading = false;
                    });
            }
            $scope.reload();

            $scope.save = function() {
                $scope.loading = true;
                $userService.createGuest($scope.newGuest).then(function (response) {
                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                            $scope.loading = false;
                        }
                        else {
                            var newUser = response.data.user;
                            $propertyUsersService.linkGuest(property._id,response.data.user._id).then(function (response) {
                                if (response.data.errors) {
                                    toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                                    $scope.loading = false;
                                }
                                else {
                                    toastr.success("Contact <B>" + newUser.name + "</B> added successfully.");
                                    $scope.reload();
                                }
                            },
                            function (error) {
                                toastr.error("Unable to create. Please contact the administrator.");
                                $scope.loading = false;
                            });

                        }
                    },
                    function (error) {
                        toastr.error("Unable to create. Please contact the administrator.");
                        $scope.loading = false;
                    });
            }


        }]);
});