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

    app.controller('fullController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService', '$stateParams', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService,$stateParams) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = [];
        //window.renderable = true;

        $scope.localLoading = false;

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.summary = $cookieSettingsService.getSummary();


        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $scope.localLoading = false;

                $propertyService.full(
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
                    var resp = $propertyService.parseDashboard(response.data.dashboard,$scope.summary);

                    $scope.property = resp.property;
                    $scope.comps = resp.comps;

                    $scope.mapOptions = resp.mapOptions;
                    $scope.bedrooms = resp.bedrooms;
                    $scope.bedroom = resp.bedroom;;

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;

                        $scope.setRenderable();
                });
            }
        };

        $scope.loadProperty($stateParams.id);

        $scope.setRenderable = function() {
            window.setTimeout(function() {
                window.renderable = true;
            },500)
        }

    }]);
});