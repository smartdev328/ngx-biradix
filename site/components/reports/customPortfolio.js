angular.module('biradix.global').directive('customPortfolio', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                showLeases: '=',
                show: '=',
                settings: '=',
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
            templateUrl: '/components/reports/customPortfolio.html?bust=' + version
        };
    })
