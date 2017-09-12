'use strict';
define([
    'app'
], function (app) {
    app.directive('trendsReport', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                settings: '=',
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/reports/trendsReport.html?bust=' + version
        };
    })

})
