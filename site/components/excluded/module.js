angular.module("biradix.global").directive("excluded", function () {
    return {
        restrict: "E",
        scope: {
            excludedList: "=",
            appliedPerspective: "=",
            propertyId: "=",
            key: "=",
            excludedPopups: "="
        },
        controller: function ($scope, $element, $rootScope) {
            $scope.excludedPopups = $scope.excludedPopups || {};

            $scope.options = {
                isOpen: false
            };
            $scope.hintTemplate = '/components/excluded/hint.html?bust=' + version;


            $scope.$watch("options.isOpen", function(value) {
                $scope.excludedPopups[$scope.key] = value;
            }, true);

            $scope.close = function () {
                $scope.options.isOpen = false;
            };

            $scope.openPopup = function($event) {
                for(var k in $scope.excludedPopups) {
                    if ($scope.excludedPopups[k]) {
                        return;
                    }
                }

                var el = angular.element($event.toElement);

                el.triggerHandler("click");
            };
        },
        templateUrl: '/components/excluded/excluded.html?bust=' + version
    };
});
