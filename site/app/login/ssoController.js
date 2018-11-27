"use strict";
define([
    "app",
    "../../services/authService"
], function (app) {

    app.controller("ssoController", 
        ["$scope","$rootScope", "$location","toastr", "$authService","$window","$stateParams",
            function ($scope,$rootScope,$location,toastr, $authService,$window,$stateParams) {

            if (maintenance === true && $location.path().indexOf("maintenance") == -1) {
                return $location.path("/maintenance");
            }
                $scope.submit = function() {
                    $scope.localLoading = true;

                    $authService.getDomain($scope.email).then(function (domainInfo) {
                            if (domainInfo && domainInfo.data && domainInfo.data.domain) {
                                var domain = "https://" + domainInfo.data.domain;

                                if (domainInfo.data.domain === location.hostname) {
                                    $location.path("/login").search("r", $stateParams.r);
                                } else {
                                    location.href = domain + "/#login?r=" + encodeURIComponent($stateParams.r);
                                }
                            } else {
                                toastr.error("Unable to locate your email address.");
                                $scope.localLoading = false;
                            }
                        },
                        function(errors) {
                            toastr.error('Unable to access the system as this time. Please contact an administrator');
                            $scope.localLoading = false;
                        });
                }
            }]);
});
