'use strict';
define([
    'app',
    '../../services/contactService'
], function (app) {

    app.controller('contactOffController', ['$scope','$rootScope','$location','toastr','$window','$contactService', '$stateParams',
        function ($scope,$rootScope,$location,toastr,$window,$contactService,$stateParams) {

            $scope.user = $scope.user || {};
            window.document.title = "Contact Us | BI:Radix";

            if ($rootScope.loggedIn) {
                $location.path('/dashboard')
            }

            if ($stateParams.e) {
                $scope.user.email = $stateParams.e;
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
                            $location.path('/contact/thankyou?e=' + $scope.user.email)
                        }
                    },
                    function(errors) {
                        toastr.error('Unable to access the system at this time. Please contact an administrator.');
                        $scope.localLoading = false;
                    });
            }

        }]);
});
