'use strict';
define([
    'app',
    '../../services/gridService',
], function (app) {
    app.directive('propertyFloorplans', function () {
        return {
            restrict: 'E',
            scope: {
                comp: '=',
                orderBy: '='
            },
            controller: function ($scope, $gridService) {
                $scope.sort = {}
                $scope.defaultSort = "sqft";

                $scope.$watch("comp", function() {
                    if ($scope.comp) {
                        $scope.comp.survey.floorplans.forEach(function(fp) {
                            fp.unitPercent = fp.units / $scope.comp.totalUnits * 100;
                        })
                    }
                }, true)


                $scope.bedroomsLabel = function(i) {

                    switch (parseInt(i)) {
                        case 0:
                            return "Studios";
                        default:
                            return i + " Bedrooms";
                    }
                }

                $scope.toggleSort = function (v) {
                    $gridService.toggle($scope.sort, v, true)

                    var s = $scope.sort[v];

                    if (s == null) {
                        $scope.orderBy = $scope.defaultSort;
                        return;
                    }

                    if (s == true) {
                        $scope.orderBy = "-" + v;
                    }
                    else {
                        $scope.orderBy = v;
                    }

                }
            },
            templateUrl: '/components/propertyProfile/propertyFloorplans.html?bust=' + version
        };
    })
})
