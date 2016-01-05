'use strict';
define([
    'app',
    '../services/authService',
    '../services/propertyService',
    '../components/daterangepicker/module',
    '../components/filterlist/module',
    '../components/timeseries/module',
], function (app) {

    app.controller('rootController', ['$scope','$location','$rootScope','$cookies','$authService','$propertyService', '$window', '$modal', 'toastr', 'ngProgress', '$timeout', function ($scope, $location, $rootScope, $cookies, $authService,$propertyService, $window, $modal, toastr,ngProgress,$timeout) {

        var refreshFactor = 1;

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

                        if ($rootScope.me.version.toString() != version.toString()) {
                               location.reload();
                        }

                        $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min


                        if (callback) {
                            callback();
                        }
                    }
                    else if (status == 401 ) {
                        if ($rootScope.loggedIn) {
                            $window.sessionStorage.redirect = $location.path();
                        }
                        $rootScope.logoff()
                    }
                    else if (status == 0 ) {
                        $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
                    }
                })
            }
            else {
                $rootScope.getMe(function() {
                    if ($rootScope.me.version.toString() != version.toString()) {
                        location.reload();
                    }

                    $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
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

                        if (!phantom) {
                            $timeout(function() {
                                $location.path("/updateProfile").search('password', '1');
                            }, 2000)

                        }
                    }
                    else
                    if ($scope.first && $rootScope.me.bounceReason) {
                        $scope.first = false;

                        if (!phantom) {
                            $timeout(function() {
                                $location.path("/updateProfile");
                            }, 2000)
                        }
                    }

                    if (callback) {
                        callback();
                    }
                }
                else if (status == 401) {
                    if ($rootScope.loggedIn) {
                        $window.sessionStorage.redirect = $location.path();
                    }
                    $rootScope.logoff()
                }
                else if (status == 0) {
                    if (callback) {
                        callback();
                    }
                }
            })

        }

        $rootScope.updateLogos = function() {
            $('.logoBig').each(function(l) {
                this.src = "/images/organizations/" + $rootScope.me.org.logoBig
            })

            $('.logoSmall').each(function(l) {
                this.src = "/images/organizations/" + $rootScope.me.org.logoSmall
            })
        }

        $rootScope.swaptoLoggedIn = function() {
            require([
                'css!/css/navs',
                'css!/css/grids'
            ], function () {
                $rootScope.getMe(function() {
                    $('.loading').hide();
                    $('.loggedout').hide();
                    $('.loggedin').show();

                    $('body').css("padding-top","0px")

                    $rootScope.updateLogos();


                    $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
                    $timeout($rootScope.incrementTimeout, 1000);

                    if ($window.sessionStorage.redirect) {
                        $timeout(function() {
                            var x = $window.sessionStorage.redirect;
                            $window.sessionStorage.removeItem('redirect');
                            $location.path(x)
                        }, 2000);
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
        $rootScope.logoff = function() {
            $rootScope.loggedIn = false;
            $cookies.remove('token');
            $rootScope.swaptoLoggedOut();
            $location.path("/login")
        }

        $rootScope.toggleUnlniked = function() {
            //$rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
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

        $scope.getLocation = function (val) {
            return $propertyService.search({search: val, active: true}).then(function (response) {
                return response.data.properties
            });
        };

        $scope.searchSelected = function (item, model, label) {
            $scope.search1 = "";
            $scope.search2 = "";
            $rootScope.turnOffSearch();
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
        $('#mobile-nav').css("width",w.width() + "px")

        w.bind('resize', function () {
            if (w.width() > 767) {
                $('#wrapper').removeClass('toggled');
                $('#searchBar').hide();
                $rootScope.$broadcast('size', w.width());
            } else {
                $rootScope.$broadcast('size', w.width());
            }

            $('#mobile-nav').css("width",w.width() + "px")
        });

        $rootScope.toggle = function() {
            $('#wrapper').toggleClass('toggled');
            $rootScope.turnOffSearch();
        }

        $rootScope.toggleSearch = function() {
            $('#searchBar').slideToggle( "slow");
            $('#wrapper').removeClass('toggled');
        }

        $rootScope.turnOffSearch = function() {
            $('#searchBar').hide();
        }

        $rootScope.turnOffIfMobile = function() {
            if ($( window ).width() <= 767)
            {
                $('#wrapper').removeClass('toggled');
                $rootScope.turnOffSearch();
            }
        }

        $rootScope.test_error = function() {
            a = b;
        }

        $rootScope.marketSurvey = function (id, surveyid) {
            require([
                '/app/marketSurvey/marketSurveyController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/marketSurvey/marketSurvey.html?bust='+version,
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