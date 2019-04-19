angular.module("biradix.global").controller("marketSurveyFloorplanController", ["$scope", "$uibModalInstance", "floorplan",
    function($scope, $uibModalInstance, floorplan) {
        $scope.floorplan = floorplan;
        console.log($scope.floorplan);
        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
