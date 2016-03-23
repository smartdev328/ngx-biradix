'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyProfile', function () {
        return {
            restrict: 'E',
            scope: {
                property: '=',
                show: '='
            },
            controller: function ($scope) {
                if ($scope.show && typeof $scope.show == "string") {
                    $scope.show = JSON.parse($scope.show);
                }
            },
            templateUrl: '/components/propertyProfile/propertyProfile.html?bust=' + version
        };
    })

})
