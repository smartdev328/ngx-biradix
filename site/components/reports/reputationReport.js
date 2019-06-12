angular.module("biradix.global").directive("reputationReport", function() {
    return {
        restrict: "E",
        scope: {
            subject: "=",
            comps: "=",
            report: "=",
        },
        controller: function($scope) {

            $scope.openPopup = function($event) {

                var el = angular.element($event.toElement);

                el.triggerHandler("click");
            };

            var yelpNumber = $scope.report.averages.yelpRatingAverage.toFixed(1).toString().split(".")[0];
            var yelpDecimal = $scope.report.averages.yelpRatingAverage.toFixed(1).toString().split(".")[1];
            if(parseInt(yelpDecimal) < 3) {
                $scope.report.averages.yelpRatingAverage = parseInt(yelpNumber);
            } else if(parseInt(yelpDecimal) > 7) {
                $scope.report.averages.yelpRatingAverage = parseInt(yelpNumber) + 1;
            } else {
                $scope.report.averages.yelpRatingAverage = parseInt(yelpNumber) + 0.5;
            }

        },
        templateUrl: "/components/reports/reputationReport.html?bust=" + version,
    };
});
