angular.module("biradix.global").directive("excluded", function () {
    return {
        restrict: "E",
        scope: {
            excludedList: "=",
            appliedPerspective: "=",
            propertyId: "="
        },
        controller: function ($scope, $element, $rootScope) {
            $scope.isOpen = false;
            $scope.hintTemplate = '/components/excluded/hint.html?bust=' + version;

            $scope.openPopup = function($event) {
                if ($scope.isOpen) {
                    return;
                }

                var el = angular.element($event.toElement);

                el.triggerHandler("click");
            };

            $scope.showExcluded = function() {
                var html = "";

                if ($scope.appliedPerspective) {
                    html += "<b>Perspective Applied:</b> <Br> <a href='/#/perspectives?prId=" + $scope.propertyId +"&pId=" + $scope.appliedPerspective.id + "' target='_blank'>" + $scope.appliedPerspective.name + "</a><Br><BR>";
                    html += "Some floor plans are not part of the perspective and has been excluded from calculations.<Br><Br>";
                    html += "Click the <i class=\"fa fa-eye-slash\"></i> icon to view excluded floor plans</a>"
                } else {
                    html += "Some property floor plans are missing rent values and are being excluded from calculations. Please complete a new property survey to get accurate calculations.<Br><Br>";
                    html += "Click the <i class=\"fa fa-warning orange\"></i> icon to view floor plans with missing rent values</a>"
                }

                return html;
            };
        },
        templateUrl: '/components/excluded/excluded.html?bust=' + version
    };
});
