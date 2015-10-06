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
                clickFn: '&'

            },
            controller: function ($scope) {

                $scope.click = function() {

                    if ($scope.clickFn) {
                        $scope.clickFn();
                    }

                    //$scope.checked = !$scope.checked;


                }

            },
            templateUrl: '/components/toggle/toggle.html?bust=' + version
        };
    })
})
