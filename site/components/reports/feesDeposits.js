'use strict';
define([
    'app',
], function (app) {
    app.directive('feesReport', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
            },
            controller: function ($scope) {
                $scope.uniqueAmenities = [];
                $scope.hash = {};
                $scope.report.forEach(function(x) {
                    if ($scope.uniqueAmenities.indexOf(x[1]) == -1) {
                        $scope.uniqueAmenities.push(x[1])
                    }
                    $scope.hash[x[0] + x[1]] = x[2];
                })

            },
            templateUrl: '/components/reports/feesDeposits.html?bust=' + version
        };
    })

})
