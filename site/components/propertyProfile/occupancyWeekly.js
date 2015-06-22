'use strict';
define([
    'app',
], function (app) {
    app.directive('occupancyWeekly', function () {
        return {
            restrict: 'E',
            scope: {
                data: '=',
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/propertyProfile/occupancyWeekly.html'
        };
    })
})
