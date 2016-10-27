'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyStatus', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                showLeases: '='
            },
            controller: function ($scope) {
            },
            templateUrl: '/components/reports/propertyStatus.html?bust=' + version
        };
    })

})
