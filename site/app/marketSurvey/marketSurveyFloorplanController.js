angular.module("biradix.global").controller("marketSurveyFloorplanController", ["$scope", "$uibModalInstance", "floorplan",
    function($scope, $uibModalInstance, floorplan) {
        $scope.floorplan = floorplan;
        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
