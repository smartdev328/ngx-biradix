'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyAbout', function () {
        return {
            restrict: 'E',
            scope: {
                property: '=',
            },
            controller: function ($scope) {

            },
            templateUrl: '/components/propertyProfile/propertyAbout.html'
        };
    })
})
