angular.module('biradix.global').directive('propertyFees', function () {
        return {
            restrict: 'E',
            scope: {
                fees: '=',
             },
            controller: function ($scope) {


            },
            templateUrl: '/components/propertyProfile/propertyFees.html?bust=' + version
        };
    })
