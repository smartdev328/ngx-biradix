'use strict';
define([
    'app',
    '../../services/contactService'
], function (app) {

    app.controller('contactOffController', ['$scope','$rootScope','$location','toastr','$window','$contactService', function ($scope,$rootScope,$location,toastr,$window,$contactService) {

        if ($rootScope.loggedIn) {
            $location.path('/dashboard')
        }

        $scope.btnSubmit = function() {
            $scope.localLoading = true;
            $contactService.send($scope.user).then(function (resp) {
                    $scope.localLoading = false;
                    if (resp.data.errors) {
                        var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                        toastr.error(errors);
                    }
                    else {
                        $location.path('/contact/thankyou')
                    }
                },
                function(errors) {
                    toastr.error('Unable to access the system as this time. Please contact an administrator');
                    $scope.localLoading = false;
                });
        }

    }]);
});