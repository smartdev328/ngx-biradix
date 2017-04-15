angular.module('biradix.global').directive('toggleSwitch', function () {
    return {
        restrict: 'E',
        scope: {
            checked: '=',
            disabled: '=',
            popover: '=',
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

