angular.module("biradix.global").controller("marketSurveyOccupancyController", ["$scope", "$uibModalInstance", "occupiedUnitCounts", "totalUnits", "occupancy",
    function($scope, $uibModalInstance, occupiedUnitCounts, totalUnits, occupancy) {
        $scope.occupiedUnitCounts = occupiedUnitCounts;
        $scope.totalUnits = totalUnits;
        $scope.occupancy = occupancy;
        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
