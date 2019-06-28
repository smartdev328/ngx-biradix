angular.module("biradix.global").controller("marketSurveyTrafficController", ["$scope", "$uibModalInstance", "propertyProspects", "dates",
    function($scope, $uibModalInstance, propertyProspects, dates) {
        $scope.propertyProspects = propertyProspects;

        $scope.dates = dates;

        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
