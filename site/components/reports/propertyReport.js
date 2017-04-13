'use strict';
define([
    'app',
    '../../services/propertyService',
], function (app) {
    app.directive('propertyReport', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                me: '=',
                dashboardSettings: '=',
                profileSettings: '=',
                showProfile: '='
            },
            controller: function ($scope,$propertyService) {
                var resp = $propertyService.parseDashboard($scope.report.dashboard,$scope.dashboardSettings.summary, $scope.me.settings.showLeases, $scope.dashboardSettings.nerScale, $scope.dashboardSettings.selectedBedroom);

                $scope.property = resp.property;
                $scope.comps = resp.comps;

                if ($scope.comps.length > 13) {
                    $scope.stretchComps = true;
                }
                $scope.mapOptions = resp.mapOptions;
                $scope.bedrooms = resp.bedrooms;
                $scope.bedroom = resp.bedroom;

                $scope.points = resp.points;
                $scope.nerData = resp.nerData;
                $scope.occData = resp.occData;
                $scope.leasedData = resp.leasedData;

                $scope.profiles = [];

                $scope.columns = ['occupancy'];

                if ($scope.me.settings.showLeases) {
                    $scope.columns.push('leased');
                }
                if ($scope.me.settings.showRenewal) {
                    $scope.columns.push('renewal');
                }

                $scope.columns.push('leases');
                $scope.columns.push('traffic');

                $scope.report.profiles.forEach(function(p) {
                    resp = $propertyService.parseProfile(p,$scope.profileSettings.graphs,$scope.me.settings.showLeases, $scope.me.settings.showRenewal, $scope.dashboardSettings.nerScale);

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

            },
            templateUrl: '/components/reports/propertyReport.html?bust=' + version
        };
    })

})
