'use strict';
define([
    'app',
    './trendsTimeseries.js'
], function (app) {
    app.directive('trendsReport', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                settings: '=',
            },
            controller: function ($scope,$element) {

                Highcharts.Pointer.prototype.reset = function () {
                    return undefined;
                };

                $scope.cbLegendClicked = function(legend) {
                    $scope.legendUpdated = legend;
                }

                $scope.$watch('report', function(a,b){
                    $scope.options = {};
                    if ($scope.report) {

                        var height = 200;
                        var printWidth = 1200;

                        $scope.options.nersqft = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 2, metric: 'nersqft', title: "Net Effective Rent / Sqft $"}
                        $scope.options.ner = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 0, metric: 'ner', title: "Net Effective Rent $"}
                        $scope.options.occupancy = {height:height, printWidth:printWidth, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'occupancy', title: "Occupancy %"}

                        $scope.options.leased = {height:height, printWidth:printWidth, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'leased', title: "Leased %"}
                        $scope.options.renewal = {height:height, printWidth:printWidth, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'renewal', title: "Renewal %"}
                        $scope.options.traffic = {height:height, printWidth:printWidth, prefix: '', suffix: '', decimalPlaces: 0, metric: 'traffic', title: "Traffic / Week"}
                        $scope.options.leases = {height:height, printWidth:printWidth, prefix: '', suffix: '', decimalPlaces: 0, metric: 'leases', title: "Leases / Week"}
                        $scope.options.concessions = {height:height, printWidth:printWidth, prefix: '$', suffix: '', decimalPlaces: 2, metric: 'concessions', title: "Total Concessions $"}

                    }

                });
            },
            templateUrl: '/components/reports/trendsReport.html?bust=' + version
        };
    })

})
