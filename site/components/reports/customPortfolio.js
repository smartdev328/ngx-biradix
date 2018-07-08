angular.module('biradix.global').directive('customPortfolio', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                showLeases: '=',
                show: '='
            },
            controller: function ($scope) {
            },
            templateUrl: '/components/reports/customPortfolio.html?bust=' + version
        };
    })
