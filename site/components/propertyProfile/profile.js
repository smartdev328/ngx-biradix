angular.module('biradix.global').directive('propertyProfile', function () {
        return {
            restrict: 'E',
            scope: {
                property: '=',
                show: '=',
                roles: '='
            },
            controller: function ($scope) {
                if ($scope.show && typeof $scope.show == "string") {
                    $scope.show = JSON.parse($scope.show);
                }
                $scope.phantom = phantom;
            },
            templateUrl: '/components/propertyProfile/propertyProfile.html?bust=' + version
        };
    })
