angular.module('biradix.global').directive('propertyStatus', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                showLeases: '=',
                show: '='
            },
            controller: function ($scope) {
                $scope.excludedPopups = {};
                $scope.perspectives = "";
                var perspectiveMap = {};

                $scope.report.forEach(function(block) {
                    block.forEach(function(row) {
                        if (row.appliedPerspective && row.excludedList && Object.keys(row.excludedList).length > 0) {
                            if (!perspectiveMap[row.appliedPerspective.id]) {
                                if ($scope.perspectives) {
                                    $scope.perspectives += ", ";
                                }
                                $scope.perspectives += row.appliedPerspective.name;
                            }
                            perspectiveMap[row.appliedPerspective.id] = true;
                        }
                    });

                    if (Object.keys(perspectiveMap).length > 5) {
                        $scope.perspectives = "Multiple";
                    }
                });
            },
            templateUrl: '/components/reports/propertyStatus.html?bust=' + version
        };
    })
