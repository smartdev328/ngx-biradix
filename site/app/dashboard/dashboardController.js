'use strict';
define([
    'app',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/comps',
    '../../components/googleMap/module',
    '../../components/toggle/module',
    '../../components/daterangepicker/module',
    '../../components/timeseries/module',
    '../../services/cookieSettingsService'
], function (app) {

    app.controller('dashboardController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        //window.renderable = true;

        $scope.localLoading = false;

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.summary = $cookieSettingsService.getSummary();

        $scope.selectedBedroom = -1;
        $scope.bedrooms = [{value: -1, text: 'All'}]

        $scope.$watch('daterange', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveDaterange($scope.daterange)
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('summary', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveSummary($scope.summary)
            $scope.refreshGraphs();
        }, true);

        $scope.refreshGraphs = function() {
            $scope.selectedBedroom = $scope.bedroom.value;
            $scope.loadProperty($rootScope.me.settings.defaultPropertyId, true);
        }

        $propertyService.search({limit: 1000, permission: 'PropertyManage', active: true}).then(function (response) {
            $scope.myProperties = response.data.properties;


            var id = $rootScope.me.settings.defaultPropertyId;


            if (!$scope.myProperties || $scope.myProperties.length == 0) {
                id = null;
            }
            else if (!id) {
                $scope.selectedProperty = $scope.myProperties[0];
            } else {
                $scope.selectedProperty = _.find($scope.myProperties, function(x) {return x._id.toString() == id})
            }

            if ($scope.selectedProperty) {
                $scope.loadProperty($scope.selectedProperty._id)
            } else {
                $scope.localLoading = true;
            }

        })

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

        $scope.$on('data.reload', function(event, args) {
            $scope.changeProperty();
        });

        $scope.loadProperty = function(defaultPropertyId, trendsOnly) {
            if (defaultPropertyId) {
                if (!trendsOnly) {
                    $scope.localLoading = false;
                } else {
                    $scope.trendsLoading = false;
                }
                $propertyService.dashboard(
                    defaultPropertyId
                    , $scope.summary
                    , $scope.selectedBedroom
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                        }
                    ,{ner: true, occupancy: true, graphs: true}
                ).then(function (response) {

                    var resp = $propertyService.parseDashboard(response.data,$scope.summary);

                    if (!trendsOnly) {
                        $scope.property = resp.property;
                        $scope.comps = resp.comps;

                        $scope.mapOptions = resp.mapOptions;
                        $scope.bedrooms = resp.bedrooms;
                        $scope.bedroom = resp.bedroom;;
                    }

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;
                });
            }
        };


    }]);
});