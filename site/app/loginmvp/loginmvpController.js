"use strict";
define([
    "app",
    "../../services/authService"
], function (app) {

    app.controller(
        "loginmvpController",
        [
            "$scope",
            "$rootScope",
            "$location",
            "toastr",
            "$authService",
            "$window",
            "$stateParams",
            function ($scope, $rootScope, $location, toastr, $authService, $window, $stateParams) {

        if (maintenance === true && $location.path().indexOf("maintenance") == -1) {
            return $location.path("/maintenance");
        }

        $scope.step = 'email';
        if ($stateParams.e) {
            $scope.email = $stateParams.e;
            $scope.step = 'password';
        }

        $scope.redirect = function(host) {
            var domain = "https://" + host;

            if (host === location.hostname) {
                $scope.step = 'password';
                // $location.path("/login").search("e", $scope.email || "").search("r", $stateParams.r);
            } else {
                location.href = domain + "/#login-mvp?e=" + encodeURIComponent($scope.email || "") + "&r=" + encodeURIComponent($stateParams.r);
            }
        }

        if ($rootScope.loggedIn) {
            $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    $scope.redirect($rootScope.me.orgs[0].subdomain + ".biradix.com");
                }
            }, true);
        }

        $scope.continue = function() {
            $scope.localLoading = true;

            $authService.getDomain($scope.email).then(function (domainInfo) {
                if (domainInfo && domainInfo.data && domainInfo.data.domain) {
                    $scope.redirect(domainInfo.data.domain);
                    $scope.localLoading = false;
                } else {
                    toastr.error("Unable to locate your email address.");
                    $scope.localLoading = false;
                }
            },
            function(errors) {
                toastr.error('Unable to access the system as this time. Please contact an administrator.');
                $scope.localLoading = false;
            });

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
                        $rootScope.swaptoLoggedIn();
                    }
            },
            function(errors) {
                rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                $scope.localLoading = false;
            });
        }
    }]);
});
