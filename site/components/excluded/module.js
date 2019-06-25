angular.module("biradix.global").directive("excluded", function () {
    return {
        restrict: "E",
        scope: {
            excludedList: "=",
            appliedPerspective: "=",
            propertyId: "=",
            key: "=",
            excludedPopups: "=",
            styles: "=",
            classes: "="
        },
        controller: function ($scope, $element, $uibModal) {
            $scope.excludedPopups = $scope.excludedPopups || {};
            $scope.excludedList = $scope.excludedList || {};
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

            $scope.excludedFloorplans = function (propertyId, appliedPerspective, excludedList) {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/excluded/excluded.html?bust='+version,
                    controller: 'excludedController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        appliedPerspective: function () {
                            return appliedPerspective;
                        },
                        propertyId: function () {
                            return propertyId;
                        },
                        excludedList: function () {
                            return excludedList;
                        },
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                }, function () {
                    //Cancel
                });
            }
        },
        templateUrl: '/components/excluded/excluded.html?bust=' + version
    };
});
