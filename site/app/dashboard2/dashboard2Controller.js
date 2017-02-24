'use strict';
define([
    'app',
], function (app) {

    app.controller('dashboard2Controller', ['$scope','$rootScope','$location','$propertyService', '$authService','ngProgress','toastr','$stateParams', function ($scope,$rootScope,$location,$propertyService,$authService,ngProgress,toastr,$stateParams) {
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Dashboard";

        $scope.localLoading = false;

        $scope.defaultShowProfile = function() {
            $scope.showProfile = {
                address: true,
                website: false,
                phone: true,
                email: false,
                name: false,
                const: true,
                built: true,
                ren: false,
                owner: true,
                mgmt: true,
                units: true,
                occ: true,
                leased: true,
                renewal: true,
                traf: true,
                lease: true
            }

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
            $scope.loadProperty($scope.selectedProperty._id);
            $rootScope.me.settings.defaultPropertyId = $scope.selectedProperty._id;
            $authService.updateSettings($rootScope.me.settings).then(function() {
                $rootScope.refreshToken();
            });

        }

        $scope.setProperty = function(property) {
            $scope.selectedProperty = property;

            $scope.changeProperty();
        }

        $scope.$on('data.reload', function(event, args) {
            $scope.reload();
        });

        $scope.reload = function() {
            $scope.localLoading = false;

            $propertyService.search({
                limit: 10000,
                permission: 'PropertyManage',
                active: true,
                select: "address city state zip website name survey phone email contactName constructionType yearBuilt yearRenovated owner management totalUnits"
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
                        return x._id.toString() == id
                    })

                    //if you lost access to your saved property, update your settings
                    if (!$scope.selectedProperty ) {
                        $scope.selectedProperty = $scope.myProperties[0];
                        $scope.changeProperty();
                        return;
                    }
                }

                if ($scope.selectedProperty) {
                    if($stateParams.id) {
                        $scope.changeProperty();
                    } else {
                        $scope.loadProperty($scope.selectedProperty._id)
                    }
                } else {
                    $scope.localLoading = true;
                }

            }, function (error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }

                toastr.error('Unable to access the system at this time. Please contact an administrator');
                $scope.localLoading = true;
            })
        }
        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {

                var surveyDaysAgo = 99;

                if ($scope.selectedProperty.survey  && $scope.selectedProperty.survey.date) {
                    surveyDaysAgo = (new Date().getTime() - (new Date($scope.selectedProperty.survey.date)).getTime()) / 1000 / 60 / 60 / 24;
                }

                if (surveyDaysAgo > 6) {
                    $scope.canAccess = false;
                    $rootScope.marketSurvey($scope.selectedProperty._id);
                } else {
                    $scope.canAccess = true;
                }

                $propertyService.getSubjects($scope.selectedProperty._id).then(function (response) {
                    $scope.subjects = response.data.subjects;
                    _.remove($scope.subjects, function(x) {return x._id.toString() == $scope.selectedProperty._id.toString()})
                    $scope.localLoading = true;
                }, function(error) {
                    toastr.error('Unable to access the system at this time. Please contact an administrator');
                    $scope.localLoading = false;
                })

            }
        };


    }]);
});