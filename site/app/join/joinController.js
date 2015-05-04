'use strict';
define([
    'app',
    '../../services/authService'
], function (app) {

    app.controller('joinController', ['$scope','$rootScope','$location','toastr', '$authService', function ($scope,$rootScope,$location,toastr, $authService) {

        if ($rootScope.loggedIn) {
            $location.path('/dashboard')
        }

        $scope.user = {title : "Enter title"};

        $scope.submit = function() {
            $scope.localLoading = true;

            $authService.create($scope.user).then(function (resp) {
                    if (!resp.data.user) {
                        toastr.error(_.pluck(resp.data.errors,"msg").join('<br>'), {
                            timeOut: 10000,
                            closeButton: true,
                            allowHtml: true
                        });
                        $scope.localLoading = false;
                    } else {
                        $authService.login($scope.user.email, $scope.user.password).then(function (authinfo) {
                                location.href= '/';
                            },
                            function(errors) {
                                location.href= '/';
                            });
                    }
                },
                function(errors) {
                    toastr.error('Unable to access the system as this time. Please contact an administrator', {
                        timeOut: 10000,
                        closeButton: true
                    });
                    $scope.localLoading = false;
                });
        }

        }]);
});