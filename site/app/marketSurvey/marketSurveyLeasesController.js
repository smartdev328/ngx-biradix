angular.module("biradix.global").controller("marketSurveyLeasesController", ["$scope", "$uibModalInstance", "leases", "dates",
    function($scope, $uibModalInstance, leases, dates) {
        $scope.leases = leases;
        $scope.leases.forEach(function(p) {
           p.date = new Date(p.date);
        });

        dates.startDate = new Date(dates.startDateMoment);
        dates.endDate = new Date(dates.endDateMoment);

        $scope.dates = dates;

        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
