'use strict';
define([
    'app',
    '../../services/authService'
], function (app) {

    app.controller('loginController', ['$scope','$rootScope','$location','toastr', '$authService','$window','$stateParams', '$cookies',
        function ($scope,$rootScope,$location,toastr, $authService,$window,$stateParams, $cookies) {
            if (maintenance === true && $location.path().indexOf('maintenance') === -1) {
                return $location.path("/maintenance")
            }
            $scope.o = $stateParams.o;

            window.setTimeout(function() {
                window.document.title = "Log In | BI:Radix";
            }, 1500);


            if (gHasSessionStorage && $stateParams.r) {
                $window.sessionStorage.redirect = $stateParams.r;
            }

            if ($rootScope.loggedIn) {
                $rootScope.swaptoLoggedIn();
                return;
            }

            if ($stateParams.e) {
                $scope.email = $stateParams.e;
            } else {
                return $location.path("/sso").search("r", $stateParams.r);

            }

            $scope.setRenderable = function() {
                window.setTimeout(function() {
                    window.renderable = true;
                },100)
            }

            $scope.submit = function() {
                $scope.localLoading = true;

                $authService.login($scope.email, $scope.password).then(function (authinfo) {
                        if (authinfo.data.token == null) {

                            $scope.localLoading = false;

                            if (authinfo.data[0].sso) {
                                toastr.error(authinfo.data[0].msg, "", {timeOut: 15000});
                                $location.path("/sso").search("n", 1);
                            } else {
                                toastr.error(authinfo.data[0].msg);
                            }
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

            $scope.newUser = function() {
                $cookies.remove("email");
                $location.path("/sso").search("n", 1).search("e", null).search("o", $scope.o);
            }


        }]);
});
