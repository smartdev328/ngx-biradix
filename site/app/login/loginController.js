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
            window.location.href = "/";
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
                        toastr.error(authinfo.data[0].msg);
                        $scope.localLoading = false;
                    }
                    else {
                        ga('set', 'userId', authinfo.data.user._id.toString());
                        if (window.sessionStorage.redirect) {
                            $rootScope.swaptoLoggedIn();
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