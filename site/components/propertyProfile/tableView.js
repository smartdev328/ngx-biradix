'use strict';
define([
    'app',
], function (app) {
    app.directive('tableView', function () {
        return {
            restrict: 'E',
            scope: {
                data: '=',
                columns: '='
            },
            controller: function ($scope) {

                $scope.$watch("columns", function(c) {
                    if ($scope.columns && $scope.columns[0] == 'ner') {
                        $scope.bedrooms = _.cloneDeep($scope.columns)
                        $scope.bedrooms.shift();
                    }
                })

            },
            templateUrl: '/components/propertyProfile/tableView.html'
        };
    })
})
