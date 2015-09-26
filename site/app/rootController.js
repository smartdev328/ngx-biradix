'use strict';
define([
    'app',
    '../services/authService',
    '../services/propertyService'
], function (app) {

    app.controller('rootController', ['$scope','$location','$rootScope','$cookies','$authService','$propertyService', '$window', '$modal', 'toastr', 'ngProgress', '$timeout', function ($scope, $location, $rootScope, $cookies, $authService,$propertyService, $window, $modal, toastr,ngProgress,$timeout) {

        $rootScope.version = version;
        $rootScope.logoBig = logoBig;

        if ($cookies.get('token')) {
            $rootScope.loggedIn = true;
        }
        else {
            $rootScope.loggedIn = false;
        }

        $rootScope.refresh = true;
        $rootScope.timeout = 0;

        //Global functions
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

        $scope.first = true;

        $rootScope.getMe = function(callback) {

            $authService.me($cookies.get('token'), function(usr, status) {
                if (usr) {
                    $rootScope.me = usr;

                    if ($scope.first && !$rootScope.me.passwordUpdated) {
                        $scope.first = false;
                        $scope.updatePassword();
                    }

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
            require([
                'css!/css/navs'
            ], function () {
                $rootScope.getMe(function() {
                    $('.loading').hide();
                    $('.loggedout').hide();
                    $('.loggedin').show();

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

                });
            })

        }

        $rootScope.swaptoLoggedOut = function() {
            require([
                'css!/app/login/loggedout'
            ], function () {
                $('.loading').hide();
                $('.loggedout').show();
                $('.loggedin').hide();
                $('body').css("padding-top","10px")
            })
        }

        //Local functions
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
                ngProgress.complete();
                if (resp.data.errors && resp.data.errors.length > 0) {
                    var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                    toastr.error(errors);
                    $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
                }
                else {
                    if ($rootScope.me.settings.hideUnlinked) {
                        toastr.warning('Excluded comped floor plans will now be hidden in all your data results.')
                    } else {
                        toastr.success('Excluded comped floor plans will now be shown in all your data results.')
                    }


                    $rootScope.refreshToken(function() {
                        $rootScope.$broadcast('data.reload');
                    });
                }


            }, function (err) {
                $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
                toastr.error('Unable to perform action. Please contact an administrator');
                ngProgress.complete();
            });




        }

        $scope.updatePassword = function() {
            require([
                '/app/updatepassword/updatePasswordController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/updatepassword/updatePassword.html',
                    controller: 'updatePasswordController',
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
            return $propertyService.search({search: val, active: true}).then(function (response) {
                return response.data.properties
            });
        };

        $scope.searchSelected = function (item, model, label) {
            $scope.search1 = "";
            $scope.search2 = "";

            $location.path("/profile/" + item._id);
        }

        //Decide if logged in or not.
        if (!$rootScope.loggedIn) {
            $rootScope.swaptoLoggedOut();
        }
        else {
            $rootScope.swaptoLoggedIn();
        }

        //make sure in full screen right nav is always shown
        var w = angular.element($window);

        w.bind('resize', function () {
            if (w.width() > 767) {
                $('#wrapper').removeClass('toggled');
                $('#searchBar').hide();
                $rootScope.$broadcast('size', w.width());
            } else {
                $rootScope.$broadcast('size', w.width());
            }
        });

        $rootScope.toggle = function() {
            $('#wrapper').toggleClass('toggled');
        }

        $rootScope.toggleSearch = function() {
            $('#searchBar').slideToggle( "slow");
        }

        $rootScope.turnOffIfMobile = function() {
            if ($( window ).width() <= 767)
            {
                $('#wrapper').removeClass('toggled');
            }
        }

        $rootScope.marketSurvey = function (id, surveyid) {
            require([
                '/app/marketSurvey/marketSurveyController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/marketSurvey/marketSurvey.html',
                    controller: 'marketSurveyController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        id: function () {
                            return id;
                        },
                        surveyid: function () {
                            return surveyid;
                        },
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                }, function () {
                    //Cancel
                });
            });
        }

    }]);
});