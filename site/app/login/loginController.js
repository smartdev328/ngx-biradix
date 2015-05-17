'use strict';
define([
    'app',
    '../../services/authService'
], function (app) {

    app.controller('loginController', ['$scope','$rootScope','$location','toastr', '$authService','$window', function ($scope,$rootScope,$location,toastr, $authService,$window) {

        if ($rootScope.loggedIn) {
            $location.path('/dashboard')
        }

        $scope.setRenderable = function() {
            window.setTimeout(function() {
                window.renderable = true;
            },100)
        }

        $scope.submit = function() {
            $scope.localLoading = true;

            $authService.login($scope.email, $scope.password).then(function (authinfo) {
                    if (authinfo.data.token == null) {
                        toastr.error('Your email address / password appear to be incorrect. Please verify them and try logging in again.');
                        $scope.localLoading = false;
                    }
                    else {
                        $window.location.href = '/'
                    }
            },
            function(errors) {
                toastr.error('Unable to access the system as this time. Please contact an administrator');
                $scope.localLoading = false;
            });
        }


        }]);
});