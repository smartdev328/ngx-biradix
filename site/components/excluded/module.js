angular.module("biradix.global").directive("excluded", function () {
    return {
        restrict: "E",
        scope: {
            excludedList: "=",
            appliedPerspective: "=",
            propertyId: "="
        },
        controller: function ($scope, $element, $rootScope) {
            $scope.options = {
                isOpen: false
            };
            $scope.hintTemplate = '/components/excluded/hint.html?bust=' + version;

            $scope.close = function () {
                $scope.options.isOpen = false;
              };

            $scope.openPopup = function($event) {
                if ($scope.options.isOpen) {
                    return;
                }

                var el = angular.element($event.toElement);

                el.triggerHandler("click");
            };
        },
        templateUrl: '/components/excluded/excluded.html?bust=' + version
    };
});
