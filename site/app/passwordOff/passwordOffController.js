'use strict';
define([
    'app',

], function (app) {

    app.controller('passwordOffController', ['$scope','$rootScope','$location','toastr','$window', '$authService', function ($scope,$rootScope,$location,toastr,$window,$authService) {

        if ($rootScope.loggedIn) {
            $location.path('/dashboard')
        }

        window.document.title = "Forgot Password | BI:Radix";

        $scope.btnSubmit = function() {
            $scope.localLoading = true;
            $authService.recoverPassword($scope.email).then(function (resp) {
                    $scope.localLoading = false;
                    if (!resp.data.success) {
                        toastr.error("Unable to locate account with that email address.");
                    }
                    else {
                        $location.path('/password/sent')
                    }
                },
                function(errors) {
                    toastr.error('Unable to access the system at this time. Please contact an administrator');
                    $scope.localLoading = false;
                });
        }

    }]);
});