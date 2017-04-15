angular.module('biradix.global').directive('propertyAbout', function () {
        return {
            restrict: 'E',
            scope: {
                property: '=',
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/propertyProfile/propertyAbout.html?bust=' + version
        };
    })
