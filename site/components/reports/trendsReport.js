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

                $scope.cbLegendClicked = function(legend) {
                    $scope.legendUpdated = legend;
                }

                $scope.$watch('report', function(a,b){
                    $scope.options = {};
                    if ($scope.report) {

                        $scope.options.ner = {height:300, printWidth:800, prefix: '$', suffix: '', decimalPlaces: 0, metric: 'ner', title: "Net Effective Rent $"}
                        $scope.options.occupancy = {height:300, printWidth:800, prefix: '', suffix: '%', decimalPlaces: 1, metric: 'occupancy', title: "Occupancy %"}

                    }

                });
            },
            templateUrl: '/components/reports/trendsReport.html?bust=' + version
        };
    })

})
