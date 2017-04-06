'use strict';
define([
    'app',
    '../../components/propertyProfile/comps',
    '../../components/propertyProfile/about',
    '../../components/propertyProfile/fees',
    '../../components/propertyProfile/amenities',
    '../../components/propertyProfile/floorplans',
    '../../components/propertyProfile/tableView',
    '../../components/googleMap/module',
    '../../services/reportingService',

], function (app) {

    app.controller('fullController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams','$cookies','$reportingService', function ($scope,$rootScope,$location,$propertyService,$authService,$stateParams,$cookies,$reportingService) {
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        //window.renderable = true;

        $scope.localLoading = false;

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {

                $scope.dashboardSettings = $reportingService.getDashboardSettings($rootScope.me, $(window).width());
                $scope.profileSettings = $reportingService.getProfileSettings($(window).width());
                $scope.showProfile = $reportingService.getInfoRows($rootScope.me);

                $scope.compItems = 0;
                for (var c in $scope.dashboardSettings.show) {
                    if ($scope.dashboardSettings.show[c] === true) {
                        $scope.compItems ++;
                    }
                }
                $scope.stretchComps = $scope.compItems >= 10 || ($scope.compItems >= 9 && $scope.dashboardSettings.show.weekly === true)

                me();
                $scope.loadProperty($stateParams.id)
            }
        });

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $scope.localLoading = false;

                $propertyService.full(
                    defaultPropertyId
                    , $scope.dashboardSettings.summary
                    , $scope.dashboardSettings.selectedBedroom
                    , {
                        daterange: $scope.dashboardSettings.daterange.selectedRange,
                        start: $scope.dashboardSettings.daterange.selectedStartDate,
                        end: $scope.dashboardSettings.daterange.selectedEndDate
                        }
                    ,{graphs: $scope.profileSettings.graphs, scale: $scope.dashboardSettings.nerScale }
                ).then(function (response) {
                    var resp = $propertyService.parseDashboard(response.data.dashboard,$scope.dashboardSettings.summary, $rootScope.me.settings.showLeases, $scope.dashboardSettings.nerScale, $scope.dashboardSettings.selectedBedroom);

                    window.document.title = resp.property.name + " - Profile + Comps | BI:Radix";

                    $scope.property = resp.property;
                    $scope.comps = resp.comps;

                    if ($scope.comps.length > 13) {
                        $scope.stretchComps = true;
                    }

                    $scope.coverPage = {
                        date: moment().format("MMM Do, YYYY"),
                        reports: [{name: $scope.property.name, items : ['Property Profile w/Comps']}],
                        org: $rootScope.me.orgs[0]
                    }

                    $scope.mapOptions = resp.mapOptions;
                    $scope.bedrooms = resp.bedrooms;
                    $scope.bedroom = resp.bedroom;;

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;
                    $scope.leasedData = resp.leasedData;

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;

                        $scope.profiles = [];

                    $scope.columns = ['occupancy'];

                    if ($rootScope.me.settings.showLeases) {
                        $scope.columns.push('leased');
                    }
                    if ($rootScope.me.settings.showRenewal) {
                        $scope.columns.push('renewal');
                    }

                    $scope.columns.push('leases');
                    $scope.columns.push('traffic');

                    var resp;
                    response.data.profiles.forEach(function(p) {
                        resp = $propertyService.parseProfile(p,$scope.profileSettings.graphs,$rootScope.me.settings.showLeases, $rootScope.me.settings.showRenewal, $scope.dashboardSettings.nerScale);

                        $scope.profiles.push({
                            lookups : resp.lookups,
                            property : resp.property,
                            comp : resp.comp,
                            points : resp.points,
                            surveyData : resp.surveyData,
                            nerData : resp.nerData,
                            occData : resp.occData,
                            otherData : resp.otherData,
                            nerKeys : resp.nerKeys,
                            otherTable : resp.otherTable
                        });
                    })

                    $scope.setRenderable();
                }, function(error) {
                    window.renderable = true;
                });
            }
        };


        $scope.setRenderable = function() {
            if (!phantom) {
                //window.setTimeout(function () {
                //    window.print();
                //}, 2000)
            }
            else {
                window.setTimeout(function () {
                    window.renderable = true;
                }, 2000)
            }
        }

    }]);
});