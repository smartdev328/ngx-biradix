'use strict';
define([
    'app'
], function (app) {
    app.directive('concession', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',

            },
            controller: function ($scope) {


            },
            templateUrl: '/components/reports/concession.html?bust=' + version
        };
    })

})
