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

            if($scope.report.averages.yelpRatingAverage) {
                $scope.report.averages.yelpRatingAverage = (Math.round($scope.report.averages.yelpRatingAverage * 2) / 2).toFixed(1);
                if(parseFloat($scope.report.averages.yelpRatingAverage) <= 0.5) {
                    $scope.report.averages.yelpRatingAverage = 0;
                }
                if($scope.report.averages.yelpRatingAverage % 1 == 0) {
                    $scope.report.averages.yelpRatingAverage = parseInt($scope.report.averages.yelpRatingAverage);
                }
            }

            $scope.report.averages.googleRatingAverage = Math.round( $scope.report.averages.googleRatingAverage * 10 ) / 10;

        },
        templateUrl: "/components/reports/reputationReport.html?bust=" + version,
    };
});
