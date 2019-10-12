'use strict';
define([
    'app',

], function (app) {

    app.controller('passwordOffController', ['$scope','$rootScope','$location','toastr','$window', '$authService', "$stateParams",
        function ($scope,$rootScope,$location,toastr,$window,$authService,$stateParams) {

          if (gHasSessionStorage && $stateParams.r) {
            $window.sessionStorage.redirect = $stateParams.r;
          }

          if ($rootScope.loggedIn) {
            $rootScope.swaptoLoggedIn();
            return;
          }

            if ($stateParams.e) {
                $scope.email = $stateParams.e;
            }

            $scope.o = $stateParams.o;

          window.setTimeout(function() {
            window.document.title = "Forgot Password | BI:Radix";
          }, 1500);

            $scope.backURL = "#/login?e=" +
                encodeURIComponent($scope.email || "") +
                "&o=" + encodeURIComponent($scope.o || "");

            $scope.btnSubmit = function() {
                $scope.localLoading = true;
                $authService.recoverPassword($scope.email).then(function (resp) {
                        $scope.localLoading = false;
                        if (!resp.data.success) {
                            toastr.error(resp.data.errors[0].msg);
                        }
                        else {
                            $location.path('/password/sent')
                        }
                    },
                    function(errors) {
                        toastr.error('Unable to access the system at this time. Please contact an administrator.');
                        $scope.localLoading = false;
                    });
            }

        }]);
});
