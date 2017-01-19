'use strict';
define([
    'app',
    '../../services/userService.js',
    '../../services/propertyService.js',
    '../../services/propertyUsersService.js',
], function (app) {
     app.controller
        ('surveySwapController', ['$scope', '$uibModalInstance', 'property', '$userService', 'ngProgress','$propertyService','$propertyUsersService','toastr','$dialog', function ($scope, $uibModalInstance, property, $userService, ngProgress,$propertyService,$propertyUsersService,toastr,$dialog) {

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


                $propertyUsersService.getPropertyAssignedUsers(property._id).then(function (response) {



                        $userService.search({ids:response.data.users, select: "first last email guestStats"}).then(function (response) {

                                $scope.users = response.data.users;

                                $scope.users.forEach(function(u) {
                                    u.lastEmailed = null;
                                    u.lastCompleted = null;

                                    if (u.guestStats) {
                                        var stats = _.find(u.guestStats, function(x) {return x.propertyid == property._id.toString()})
                                        if (stats) {
                                            u.lastEmailed = stats.lastEmailed;
                                            u.lastCompleted = stats.lastCompleted;
                                        }
                                    }
                                })
                                $scope.loading = false;
                        },
                        function (error) {
                            toastr.error("Unable to retrieve data. Please contact the administrator.");
                            $scope.loading = false;
                        });

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
                            $propertyUsersService.link(property._id,response.data.user._id).then(function (response) {
                                if (response.data.errors) {
                                    toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                                    $scope.loading = false;
                                }
                                else {
                                    toastr.success("Contact <B>" + newUser.first + ' ' + newUser.last + "</B> added successfully.");
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

            $scope.remove = function(user) {
                $dialog.confirm('Are you sure you want to remove "' + user.first + ' ' + user.last+ '?', function() {
                    $propertyUsersService.unlink(property._id,user._id).then(function (response) {
                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                                $scope.loading = false;
                            }
                            else {
                                toastr.success("Contact <B>" + user.first + ' ' + user.last + "</B> removed successfully.");
                                $scope.reload();
                            }
                        },
                        function (error) {
                            toastr.error("Unable to remove. Please contact the administrator.");
                            $scope.loading = false;
                        });
                }, function() {

                })
            }


        }]);
});