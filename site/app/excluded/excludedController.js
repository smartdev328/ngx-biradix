angular.module("biradix.global").controller("excludedController", ["$scope", "$uibModalInstance", "appliedPerspective", "excludedList", "propertyId",
    function($scope, $uibModalInstance, appliedPerspective, excludedList, propertyId) {
        $scope.appliedPerspective = appliedPerspective;
        $scope.excludedList = excludedList;
        $scope.propertyId = propertyId;
        $scope.title = $scope.appliedPerspective ? "Excluded Floor Plans" : "Missing Rent Data Floor Plans"
        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
