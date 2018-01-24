angular.module('biradix.global').directive('propertyStatus', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                showLeases: '=',
                show: '='
            },
            controller: function ($scope) {
            },
            templateUrl: '/components/reports/propertyStatus.html?bust=' + version
        };
    })
