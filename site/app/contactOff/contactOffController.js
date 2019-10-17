'use strict';
define([
    'app',
    '../../services/contactService'
], function (app) {

    app.controller('contactOffController', ['$scope','$rootScope','$location','toastr','$window','$contactService', '$stateParams',
        function ($scope,$rootScope,$location,toastr,$window,$contactService,$stateParams) {
          if (gHasSessionStorage && $stateParams.r) {
            $window.sessionStorage.redirect = $stateParams.r;
          }

          if ($rootScope.loggedIn) {
            $rootScope.swaptoLoggedIn();
            return;
          }
            $scope.user = $scope.user || {};

          window.setTimeout(function() {
            window.document.title = "Contact Us | Radix";
          }, 1500);

            if ($stateParams.e) {
                $scope.user.email = $stateParams.e;
            }

            $scope.o = $stateParams.o;

            $scope.backURL = "#/login?e=" +
                encodeURIComponent($scope.user.email || "") +
                "&o=" + encodeURIComponent($scope.o || "");

            $scope.btnSubmit = function() {
                $scope.localLoading = true;
                $contactService.send($scope.user).then(function (resp) {
                        $scope.localLoading = false;
                        if (resp.data.errors) {
                            var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                            toastr.error(errors);
                        }
                        else {
                            $location.path('/contact/thankyou').search("e", $scope.user.email).search("o", $scope.o);
                        }
                    },
                    function(errors) {
                        toastr.error('Unable to access the system at this time. Please contact an administrator.');
                        $scope.localLoading = false;
                    });
            }

        }]);
});
