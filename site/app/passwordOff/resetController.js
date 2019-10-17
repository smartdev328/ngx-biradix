'use strict';
define([
    'app',

], function (app) {

    app.controller('resetController', ['$scope','$rootScope','$location','toastr','$window', '$authService', '$stateParams', function ($scope,$rootScope,$location,toastr,$window,$authService,$stateParams) {

      if (gHasSessionStorage && $stateParams.r) {
        $window.sessionStorage.redirect = $stateParams.r;
      }

      if ($rootScope.loggedIn) {
        $rootScope.swaptoLoggedIn();
        return;
      }

      window.setTimeout(function() {
        window.document.title = "Forgot Password | Radix";
      }, 1500);

        $scope.token = $stateParams.token;

        $authService.getEmailByRecoveryToken($scope.token).then(function (response) {
                if (typeof (response.data) == 'undefined' || response.data.email == "" || response.data.email == null) {
                    $location.path('/password/invalid');
                }
                else {
                    $scope.email = response.data.email;
                }
            },

            function (data) {
                $location.path('/password/invalid');
            }

        );

        $scope.btnSubmit = function() {

            if ($scope.newpassword != $scope.confirmpassword) {
                toastr.error("Passwords do not match");
                return;
            }
            $scope.localLoading = true;
            $authService.updatePassword($scope.token, $scope.newpassword).then(function (resp) {
                    $scope.localLoading = false;
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                        toastr.error(errors);
                    }
                    else {
                        $authService.login($scope.email, $scope.newpassword).then(function (authinfo) {
                            $window.location.href = '/';

                        }, function(errors) {
                            $window.location.href = '/';
                        });
                    }
                },
                function(errors) {
                    toastr.error('Unable to access the system at this time. Please contact an administrator.');
                    $scope.localLoading = false;
                });
        }

    }]);
});
