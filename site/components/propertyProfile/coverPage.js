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
                $scope.year = (new Date()).getFullYear();
            },
            templateUrl: '/components/propertyProfile/coverPage.html?bust=' + version
        };
    })
})
