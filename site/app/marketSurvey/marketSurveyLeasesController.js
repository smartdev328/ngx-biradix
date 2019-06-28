angular.module("biradix.global").controller("marketSurveyLeasesController", ["$scope", "$uibModalInstance", "leases", "dates",
    function($scope, $uibModalInstance, leases, dates) {
        $scope.leases = leases;

        $scope.dates = dates;

        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
