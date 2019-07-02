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
            $location.path("/login").search("e", $scope.email || "").search("r", $stateParams.r);
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
                // console.log(domainInfo.data);
                if (domainInfo.data.allowSSO) {
                    var redirect_uri = (window.location.origin.indexOf('localhost') > 0 ?
                        window.location.origin :
                        'https://' + domainInfo.data.domain) + '/sso/redirected';
                    location.href = 'https://login.microsoftonline.com/ca5c5e0e-72dd-4420-8fcc-ade7747a1408/oauth2/authorize?' +
                        'client_id=b1a90195-bec0-49fe-8b89-0465e09ce3a0' +
                        '&response_type=code' +
                        '&redirect_uri=' + encodeURIComponent(redirect_uri) +
                        '&response_mode=form_post' +
                        '&state=' + $scope.email +
                        '&login_hint=' + $scope.email;
                } else {
                    $scope.redirect(domainInfo.data.domain);
                }
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
    }]);
});
