angular.module("biradix.global").controller("marketSurveyATRController", ["$scope", "$uibModalInstance", "unitCounts", "atr",
    function($scope, $uibModalInstance, unitCounts, atr) {
        $scope.show = {
            totalVacant: false,
            lessVacant: false,
        }
        $scope.unitCounts = unitCounts;
        $scope.atr = atr;
        $scope.cancel = function() {
            $uibModalInstance.dismiss("cancel");
        };
    }]);
