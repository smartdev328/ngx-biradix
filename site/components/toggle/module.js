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
                disabled: '=',
                clickFn: '&'

            },
            controller: function ($scope) {

                $scope.click = function() {

                    if ($scope.clickFn) {
                        $scope.clickFn();
                    }


                }

            },
            templateUrl: '/components/toggle/toggle.html?bust=' + version
        };
    })
})
