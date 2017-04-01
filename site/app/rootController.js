'use strict';
define([
    'app',
    '../services/authService',
    '../services/propertyService',
    '../components/daterangepicker/module',
    '../components/filterlist/module',
    '../components/timeseries/module',
    '../components/toggle/module',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/coverPage',
    '../../services/amenityService',
], function (app) {

    app.controller('rootController', ['$scope','$location','$rootScope','$cookies','$authService','$propertyService', '$window', '$uibModal', 'toastr', 'ngProgress', '$timeout','$sce','$amenityService', function ($scope, $location, $rootScope, $cookies, $authService,$propertyService, $window, $uibModal, toastr,ngProgress,$timeout,$sce,$amenityService) {

        $scope.hasSessionStorage = true;
        try {
            window.sessionStorage;
        } catch (ex) {
            $scope.hasSessionStorage = false;
        }

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
            if (!$rootScope.validateTokens()) {
                return;
            }
            if ($rootScope.refresh) {
                $authService.refreshToken($cookies.get('token'), function (usr, status) {

                    if (usr) {
                        $rootScope.me = usr;
                        $rootScope.reload = false;

                        if ($rootScope.me.version.toString() != version.toString()) {
                            $rootScope.reload = true;
                        }

                        $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min


                        if (callback) {
                            callback();
                        }
                    }
                    else if (status == 401 ) {
                        if ($rootScope.loggedIn && $scope.hasSessionStorage) {
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
                    $rootScope.reload = false;

                    if ($rootScope.me.version.toString() != version.toString()) {
                        $rootScope.reload = true;
                    }

                    $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
                    if (callback) {
                        callback();
                    }
                });
            }


        }

        $scope.searches = {
            search1: "",
            search2: "",
        }
        $scope.first = true;

        $rootScope.notifications = [];

        $rootScope.validateTokens = function() {
            if (!$cookies.get('token')) {
                if ($scope.hasSessionStorage) {
                    $window.sessionStorage.redirect = $location.path();
                }
                $rootScope.logoff();
                return false;
            }

            var date = $cookies.get('tokenDate');

            if (!date) {
                date = new Date();
            } else {
                date = new Date(date);
            }

            var tokenAgeInMinutes = (new Date().getTime() - date.getTime()) / 1000 / 60;

            if (tokenAgeInMinutes > 65) {
                if ($scope.hasSessionStorage) {
                    $window.sessionStorage.redirect = $location.path();
                }
                $rootScope.logoff();
                return false;
            }

            return true;
        }
        $rootScope.getMe = function(callback) {

            if (!$rootScope.validateTokens()) {
                return;
            }

            $authService.me($cookies.get('token'), function (usr, status) {
                if (usr) {
                    $rootScope.me = usr;

                    if ($scope.first) {
                        $scope.alerts();
                    }

                    if ($scope.first && !$rootScope.me.passwordUpdated) {
                        $scope.first = false;

                        if (!phantom) {
                            $timeout(function () {
                                $location.path("/updateProfile").search('password', '1');
                            }, 2000)

                        }
                    }
                    else if ($scope.first && $rootScope.me.bounceReason) {
                        $scope.first = false;

                        if (!phantom) {
                            $timeout(function () {
                                $location.path("/updateProfile");
                            }, 2000)
                        }
                    }

                    if (callback) {
                        callback();
                    }
                }
                else if (status == 401) {
                    if ($rootScope.loggedIn && $scope.hasSessionStorage) {
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
            var org;

            if ($rootScope.me.orgs.length == 1) {
                org = $rootScope.me.orgs[0];
            } else {
                $rootScope.me.orgs.forEach(function(x) {
                    if (x.subdomain.toLowerCase() == window.location.hostname.toLowerCase()) {
                        org = x;
                    }
                })

                if (!org) {
                    org = $rootScope.me.orgs[0];
                }

            }

            $('.logoBig').each(function(l) {
                this.src = "/images/organizations/" + org.logoBig
            })

            $('.logoSmall').each(function(l) {
                this.src = "/images/organizations/" + org.logoSmall
            })
        }

        $rootScope.swaptoLoggedIn = function(redirect) {
            require([
                'css!/css/navs',
                'css!/css/grids'
            ], function () {
                $rootScope.getMe(function() {
                    $rootScope.loggedIn = true;
                    $('.loading').hide();
                    $('.loggedout').hide();
                    $('.loggedin').show();

                    $('body').css("padding-top","0px")

                    $rootScope.updateLogos();


                    $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
                    $timeout($rootScope.incrementTimeout, 1000);

                    var ar = location.hash.split("login?r=");
                    if (ar.length == 2 && $scope.hasSessionStorage) {
                        $window.sessionStorage.redirect = decodeURIComponent(ar[1]);
                    }

                    if ($scope.hasSessionStorage && $window.sessionStorage.redirect) {
                        var x = $window.sessionStorage.redirect;
                        $window.sessionStorage.removeItem('redirect');

                        //Make sure we dont redirect to /login
                        if (x.indexOf('/login') == -1) {
                            if (x.indexOf("?") == -1) {
                                $location.path(x)
                            } else {
                                var a = x.split('?')
                                $location.path(a[0]).search(a[1]);
                            }
                        } else {
                            $location.path("/dashboard");
                        }

                    } else {
                        if (redirect !== false) {
                            $location.path("/dashboard");
                        }
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
                $rootScope.loggedIn = false;
            })
        }

        //Local functions
        $rootScope.logoff = function() {
            $rootScope.loggedIn = false;
            $cookies.remove('token');
            window.location.href = "/";
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

        $scope.sanitize = function(s) {
            return $sce.trustAsHtml(s);
        }
        $scope.getLocation = function (val) {
            return $propertyService.search({search: val, active: true, skipAmenities: true}).then(function (response) {
                return response.data.properties
            });
        };

        $scope.disableSearchKeys = function(event) {
            switch(event.keyCode) {
                case 191: // "/"
                case 220: // "\"
                    event.preventDefault();
            }
        }
        
        $scope.searchSelected = function (item, model, label) {
            $scope.searches.search1 = "";
            $scope.searches.search2 = "";
            $rootScope.turnOffSearch();
            $location.path("/profile/" + item._id);
        }

        //Decide if logged in or not.
        if (!$rootScope.loggedIn) {
            $rootScope.swaptoLoggedOut();
        }
        else {
            $rootScope.swaptoLoggedIn(false);
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

        $rootScope.toggleAlerts = function() {
            $('#alertsBar').slideToggle( "slow");
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

        $rootScope.alliance_report = function() {
            var url = '/api/1.0/properties/alliance?'
            url += "token=" + $cookies.get('token')
            location.href = url;
        }

        $rootScope.marketSurvey = function (id, surveyid,options) {
            require([
                '/app/marketSurvey/marketSurveyController.js'
            ], function () {
                var modalInstance = $uibModal.open({
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
                        options: function () {
                            return options;
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


        $scope.alerts = function() {

            if ($rootScope.me.permissions.indexOf('Admin') > -1) {
                $scope.alertsAmenities();
                $scope.alertsProperties();
            }
        };

        $scope.alertsAmenities = function() {
            $amenityService.search({active: true, unapproved: true}).then(function (response) {

                var a = _.find($rootScope.notifications, function(x) {return x.key == "amenities"});

                if (a) {
                    a.count = response.data.amenities.length;

                    if (a.count == 0) {
                        _.remove($rootScope.notifications, function(x) {return x.key == "amenities"});
                    }
                } else {
                    if (response.data.amenities.length) {
                        $rootScope.notifications.push({
                            key: "amenities",
                            count: response.data.amenities.length,
                            label: "Amenities: ",
                            url: "#/amenities"
                        })
                    }

                }
            },
            function (error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
            });

            window.setTimeout(function() {$scope.alertsAmenities()}, 120000);

        }

        $scope.alertsProperties = function() {
            $propertyService.search({limit: 10000, needsApproval:true, skipAmenities: true}).then(function (response) {

                    var a = _.find($rootScope.notifications, function(x) {return x.key == "properties"});

                    if (a) {
                        a.count = response.data.properties.length;

                        if (a.count == 0) {
                            _.remove($rootScope.notifications, function(x) {return x.key == "properties"});
                        }
                    } else {
                        if (response.data.properties.length) {
                            $rootScope.notifications.push({
                                key: "properties",
                                count: response.data.properties.length,
                                label: "Properties: ",
                                url: "#/properties"
                            })
                        }

                    }
                },
                function (error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }
                });

            window.setTimeout(function() {$scope.alertsAmenities()}, 60000);

        }
    }]);


});