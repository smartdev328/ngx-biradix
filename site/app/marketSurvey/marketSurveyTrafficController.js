angular.module("biradix.global").controller("marketSurveyTrafficController", ["$scope", "$uibModalInstance", "propertyProspects", "dates",
    function($scope, $uibModalInstance, propertyProspects, dates) {
        $scope.propertyProspects = propertyProspects;
        $scope.propertyProspects.forEach(function(p) {
           p.date = new Date(p.date);
        });

        dates.startDate = new Date(dates.startDateMoment);
        dates.endDate = new Date(dates.endDateMoment);

        $scope.dates = dates;

        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
