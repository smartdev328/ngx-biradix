'use strict';
define([
    'app',
    '../../services/authService'
], function (app) {

    app.controller('loginController', ['$scope','$rootScope','$location','toastr', '$authService','$window','$stateParams', function ($scope,$rootScope,$location,toastr, $authService,$window,$stateParams) {

        if ($stateParams.r) {
            $window.sessionStorage.redirect = $stateParams.r;
        }

        if ($rootScope.loggedIn) {
            var x = $window.sessionStorage.redirect;
            $window.sessionStorage.removeItem('redirect');

            if (x.indexOf("?") == -1) {
                $location.path(x)
            } else {
                var a = x.split('?')
                $location.path(a[0]).search(a[1]);
            }
            return;
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
                        if (window.sessionStorage.redirect) {
                            window.location.href = '/#' + window.sessionStorage.redirect;
                            $window.sessionStorage.removeItem('redirect');
                            console.log(window.location.href);
                            window.location.reload();
                        } else {
                            window.location.href = "/";
                        }
                    }
            },
            function(errors) {
                toastr.error('Unable to access the system as this time. Please contact an administrator');
                $scope.localLoading = false;
            });
        }


        }]);
});