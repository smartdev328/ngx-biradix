'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyFloorplans', function () {
        return {
            restrict: 'E',
            scope: {
                comp: '=',
            },
            controller: function ($scope) {
                $scope.bedroomsLabel = function(i) {

                    switch (parseInt(i)) {
                        case 0:
                            return "Studios";
                        default:
                            return i + " Bedrooms";
                    }
                }
            },
            templateUrl: '/components/propertyProfile/propertyFloorplans.html'
        };
    })
})
