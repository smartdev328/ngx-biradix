angular.module('biradix.global').directive('concession', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',

            },
            controller: function ($scope) {
                $scope.excludedPopups = {};

            },
            templateUrl: '/components/reports/concession.html?bust=' + version
        };
    })
