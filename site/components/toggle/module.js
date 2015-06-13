'use strict';
define([
    'app',
    'css!/components/toggle/style'
], function (app) {
    app.directive('toggleSwitch', function () {
        return {
            restrict: 'E',
            scope: {
                checked: '=',
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/toggle/toggle.html'
        };
    })
})
