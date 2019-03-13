"use strict";
define([
    "app",
    "../../services/authService"
], function (app) {

    app.controller("ssoController", ["$scope","$rootScope", "$location","toastr", "$authService","$window","$stateParams",
            function ($scope,$rootScope,$location,toastr, $authService,$window,$stateParams) {

    if (maintenance === true && $location.path().indexOf("maintenance") == -1) {
        return $location.path("/maintenance");
    }

    $scope.redirect = function(host) {
        var domain = "https://" + host;

        if (host === location.hostname) {
            $location.path("/login").search("e", encodeURIComponent($scope.email || "")).search("r", $stateParams.r);
        } else {
            location.href = domain + "/#login?e=" + encodeURIComponent($scope.email || "") + "&r=" + encodeURIComponent($stateParams.r);
        }
    }

    if ($rootScope.loggedIn) {
        $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                $scope.redirect($rootScope.me.orgs[0].subdomain + ".biradix.com");
            }
        }, true);
    }

    $scope.submit = function() {
        $scope.localLoading = true;

        $authService.getDomain($scope.email).then(function (domainInfo) {
            if (domainInfo && domainInfo.data && domainInfo.data.domain) {
                $scope.redirect(domainInfo.data.domain);
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
