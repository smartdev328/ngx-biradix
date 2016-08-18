'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyFees', function () {
        return {
            restrict: 'E',
            scope: {
                fees: '=',
                lookups: '='
            },
            controller: function ($scope) {


                $scope.$watch("fees", function() {
                    $scope.final = [];
                    for (var key in $scope.fees) {
                        $scope.final.push({display: $scope.lookups[key], value: $scope.fees[key]} );
                    }

                }, true)


            },
            templateUrl: '/components/propertyProfile/propertyFees.html?bust=' + version
        };
    })
})
