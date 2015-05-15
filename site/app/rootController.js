'use strict';
define([
    'app',
    '../services/authService',
    '../services/propertyService'
], function (app) {

    app.controller('rootController', ['$scope','$location','$rootScope','$cookies','$authService','$propertyService', '$window', '$modal', 'toastr', 'ngProgress', '$timeout', function ($scope, $location, $rootScope, $cookies, $authService,$propertyService, $window, $modal, toastr,ngProgress,$timeout) {

        if ($cookies.get('token')) {
            $rootScope.loggedIn = true;
        }
        else {
            $rootScope.loggedIn = false;
        }

        $rootScope.refresh = true;
        $rootScope.timeout = 0;

        $rootScope.resetTimeout = function () {
            $rootScope.timeout = 0;
            $rootScope.refresh = true;
        }

        $rootScope.incrementTimeout = function () {
            if ($scope.$$childHead == null) {
                return;
            }
            $rootScope.timeout++;

            if ($rootScope.timeout > 60) {
                $rootScope.refresh = false;
            }

            $timeout($rootScope.incrementTimeout, 1000);
        }

        $rootScope.refreshToken = function(callback) {
            if ($rootScope.refresh) {
                $authService.refreshToken($cookies.get('token'), function (usr, status) {
                    if (usr) {
                        $rootScope.me = usr;

                        $window.setTimeout($rootScope.refreshToken,60 * 1000); // start token refresh in 1 min


                        if (callback) {
                            callback();
                        }
                    }
                    else if (status == 401) {
                        if ($rootScope.loggedIn) {
                            $window.sessionStorage.redirect = $location.path();
                        }
                        $scope.logoff()
                    }
                })
            }
            else {
                $rootScope.getMe(function() {
                    $window.setTimeout($rootScope.refreshToken,60 * 1000); // start token refresh in 1 min
                    if (callback) {
                        callback();
                    }
                });
            }

        }

        $rootScope.getMe = function(callback) {
            $authService.me($cookies.get('token'), function(usr, status) {
                if (usr) {
                    $rootScope.me = usr;

                    if (callback) {
                        callback();
                    }
                }
                else if (status == 401) {
                    if ($rootScope.loggedIn) {
                        $window.sessionStorage.redirect = $location.path();
                    }
                    $scope.logoff()
                }
            })

        }

        $rootScope.swaptoLoggedIn = function() {

            $propertyService.search({limit: 1000, permission: 'PropertyManage'}).then(function (response) {
                $rootScope.myProperties = response.data.properties;

                $rootScope.getMe(function() {
                    $('.loading').hide();
                    $('.loggedout').hide();
                    $('.loggedin').show();

                    $('body').css("background-color","#FFF")
                    $('body').css("padding-top","0px")

                    $('.logoBig').each(function(l) {
                        this.src = "/images/organizations/" + $rootScope.me.org.logoBig
                    })

                    $('.logoSmall').each(function(l) {
                        this.src = "/images/organizations/" + $rootScope.me.org.logoSmall
                    })

                    $window.setTimeout($rootScope.refreshToken,60 * 1000); // start token refresh in 1 min
                    $timeout($rootScope.incrementTimeout, 1000);

                    if ($window.sessionStorage.redirect) {
                        var x = $window.sessionStorage.redirect;
                        $window.sessionStorage.removeItem('redirect');
                        $location.path(x)
                    }
                })
            });


        }

        $rootScope.swaptoLoggedOut = function() {
            require([
                'css!/app/login/loggedout'
            ], function () {
                $('.loading').hide();
                $('.loggedout').show();
                $('.loggedin').hide();
                $('body').css("background-color","#F2F2F2")
                $('body').css("padding-top","10px")
            })
        }

        if (!$rootScope.loggedIn) {
            $rootScope.swaptoLoggedOut();
        }
        else {
            $rootScope.swaptoLoggedIn();
        }


        $scope.logoff = function() {
            $rootScope.loggedIn = false;
            $cookies.remove('token');
            $rootScope.swaptoLoggedOut();
            $location.path("/login")
        }

        $scope.toggleUnlniked = function() {
            $rootScope.me.settings.hideUnlinked = $rootScope.me.settings.hideUnlinked || false;
            $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;

            ngProgress.start();
            $authService.updateSettings($rootScope.me.settings).then(function (resp) {
                ngProgress.reset();
                if (resp.data.errors && resp.data.errors.length > 0) {
                    var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                    toastr.error(errors);
                    $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
                }
                else {
                    if ($rootScope.me.settings.hideUnlinked) {
                        toastr.warning('Unlinked floor plans will now be hidden in all your data results.')
                    } else {
                        toastr.success('Unlinked floor plans will now be shown in all your data results.')
                    }

                    $rootScope.$broadcast('settings.hideUnlinked', $rootScope.me.settings.hideUnlinked);
                    $rootScope.refreshToken();
                }


            }, function (err) {
                $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
                toastr.error('Unable to perform action. Please contact an administrator');
                ngProgress.reset();
            });




        }

        $scope.updateProfile = function() {
            require([
                '/app/updateprofile/updateProfileController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/updateprofile/updateProfile.html',
                    controller: 'updateProfileController',
                    size: "sm",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        me: function () {
                            return $rootScope.me;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    //Save successfully
                    $rootScope.refreshToken();
                }, function () {
                    //Cancel
                });
            });
        }

        $scope.contact = function () {
            require([
                '/app/contact/contactController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/contact/contact.html',
                    controller: 'contactController',
                    size: "sm",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        me: function () {
                            return $rootScope.me;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                }, function () {
                    //Cancel
                });
            });
        }

        $scope.getLocation = function (val) {
            return $propertyService.search({search: val}).then(function (response) {
                return response.data.properties
            });
        };

        $scope.searchSelected = function (item, model, label) {
            $scope.search1 = "";
            $scope.search2 = "";
            console.log(item)
        }

    }]);
});