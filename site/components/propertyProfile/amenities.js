'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyAmenities', function () {
        return {
            restrict: 'E',
            scope: {
                amenities: '=',
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/propertyProfile/propertyAmenities.html?bust=' + version
        };
    })
})
