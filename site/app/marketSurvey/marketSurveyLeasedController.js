angular.module("biradix.global").controller("marketSurveyLeasedController", ["$scope", "$uibModalInstance", "leasedUnitCounts", "totalUnits", "leased",
    function($scope, $uibModalInstance, leasedUnitCounts, totalUnits, leased) {
        $scope.leasedUnitCounts = leasedUnitCounts;
        $scope.totalUnits = totalUnits;
        $scope.leased = leased;
        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
