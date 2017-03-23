'use strict';
define([
    'app',
], function (app) {
    app.directive('coverPage', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/propertyProfile/coverPage.html?bust=' + version
        };
    })
})
