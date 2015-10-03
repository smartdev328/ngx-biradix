'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyFees', function () {
        return {
            restrict: 'E',
            scope: {
                fees: '=',
                lookups: '='
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/propertyProfile/propertyFees.html?bust=' + version
        };
    })
})
