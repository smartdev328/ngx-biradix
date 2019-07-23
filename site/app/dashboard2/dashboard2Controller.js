'use strict';
define([
    'app',
], function (app) {
    var pageViewType = 'InitialPageView';

    app.controller('dashboard2Controller', ['$scope','$rootScope','$location','$propertyService', '$authService','ngProgress','toastr','$stateParams','$reportingService', function ($scope,$rootScope,$location,$propertyService,$authService,ngProgress,toastr,$stateParams,$reportingService) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }

        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Dashboard";

        $scope.localLoading = false;

        $scope.defaultShowProfile = function() {
            $scope.showProfile = $reportingService.getDefaultInfoRows(null);
        }

        //make sure me is loaded befor you search initially
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();

                $scope.defaultShowProfile();
                $scope.reload()

            }
        });

        $scope.viewProfile = function() {
            $location.path("/profile/" + $scope.selectedProperty._id);
        }

        $scope.changeProperty = function() {
            $rootScope.refreshToken(true, function() {
                $scope.loadProperty($scope.selectedProperty._id);
                $rootScope.me.settings.defaultPropertyId = $scope.selectedProperty._id;
            });
        }

        $scope.setProperty = function(property) {
            $scope.selectedProperty = property;

            $scope.changeProperty();
        }

        $scope.$on('data.reload', function(event, args) {
            $rootScope.refreshToken(true, function() {
                $scope.reload(true);
            });
        });

        $scope.reload = function(skipGa) {
            $scope.localLoading = false;

            $propertyService.search({
                limit: 20,
                permission: 'PropertyManage',
                active: true,
                select: "address city state zip website name survey phone email contactName constructionType yearBuilt yearRenovated owner management totalUnits walkscore"
                , skipAmenities: true
            }).then(function (response) {
                $scope.myProperties = response.data.properties;


                var id = $rootScope.me.settings.defaultPropertyId;

                if($stateParams.id) {
                    id = $stateParams.id;
                    $scope.selectedProperty = id;
                }


                if (!$scope.myProperties || $scope.myProperties.length == 0) {
                    id = null;
                }
                else if (!id) {
                    $scope.selectedProperty = $scope.myProperties[0];
                } else {
                    $scope.selectedProperty = _.find($scope.myProperties, function (x) {
                        return x._id.toString() == id;
                    })

                    // if you lost access to your saved property, update your settings
                    if (!$scope.selectedProperty ) {
                        $scope.selectedProperty = $scope.myProperties[0];
                        $scope.changeProperty();
                        return;
                    }
                }

                if ($scope.selectedProperty) {
                    if ($stateParams.id) {
                        $scope.changeProperty();
                    } else {
                        $scope.loadProperty($scope.selectedProperty._id);
                    }
                } else {
                    $scope.localLoading = true;

                    if (!skipGa && ga && pageViewType && timeStart && performance && performance.now) {
                        var pageTime = performance.now() - timeStart;

                        var metrics = pageViewType === 'InitialPageView' && {
                            'metric1': 1,
                            'metric2': pageTime,
                        } || {
                            'metric3': 1,
                            'metric4': pageTime,
                        }

                        ga('send', 'event', pageViewType, 'Dashboard2', metrics);

                        pageViewType = 'PageView';
                    }
                }
            }, function(error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }

                rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                $scope.localLoading = true;
                $scope.apiError = true;
            });
        };

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {

                var surveyDaysAgo = 99;
                var guestLastUpdater = false;

                if ($scope.selectedProperty.survey  && $scope.selectedProperty.survey.date) {
                    var surveyTime = (new Date($scope.selectedProperty.survey.date)).getTime();
                    surveyDaysAgo = (new Date().getTime() - surveyTime) / 1000 / 60 / 60 / 24;
                    // console.log($scope.selectedProperty.survey.date);
                    var guest = _.find($rootScope.me.guestStats, function(x) {
                       return x.propertyid.toString() === $scope.selectedProperty._id.toString();
                    });

                    if (guest && guest.lastCompleted) {
                        var guestCompletedTime = (new Date(guest.lastCompleted)).getTime();
                        // Difference in minutes between survey and last time guest completed survey
                        if ((surveyTime - guestCompletedTime) / 1000 / 60 <= 5) {
                            // If we got here, the guest filled out the survey within 5 minutes of last survey so we assume it was them
                            guestLastUpdater = true;
                        }
                    }
                }

                if (surveyDaysAgo > 6 || !guestLastUpdater) {
                    $scope.canAccess = false;
                    $rootScope.marketSurvey($scope.selectedProperty._id);
                } else {
                    $scope.canAccess = true;
                }

                $propertyService.getGuestComps($scope.selectedProperty._id).then(function (response) {
                    $scope.subjects = response.data.comps;
                    _.remove($scope.subjects, function(x) {return x._id.toString() == $scope.selectedProperty._id.toString()})
                    $scope.localLoading = true;
                }, function(error) {
                    toastr.error('Unable to access the system at this time. Please contact an administrator.');
                    $scope.localLoading = false;
                })

            }
        };


    }]);
});
