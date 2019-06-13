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

            $scope.report.averages.yelpRatingAverage = parseFloat($scope.report.averages.yelpRatingAverage.toFixed(1));
            if(0.5 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 1.2) {
                $scope.report.averages.yelpRatingAverage = 1;
            } else if(1.3 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 1.7) {
                $scope.report.averages.yelpRatingAverage = 1.5;
            } else if(1.8 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 2.2) {
                $scope.report.averages.yelpRatingAverage = 2;
            } else if(2.3 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 2.7) {
                $scope.report.averages.yelpRatingAverage = 2.5;
            } else if(2.8 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 3.2) {
                $scope.report.averages.yelpRatingAverage = 3;
            } else if(3.3 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 3.7) {
                $scope.report.averages.yelpRatingAverage = 3.5;
            } else if(3.8 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 4.2) {
                $scope.report.averages.yelpRatingAverage = 4;
            } else if(4.3 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 4.7) {
                $scope.report.averages.yelpRatingAverage = 4.5;
            } else if(4.8 <= $scope.report.averages.yelpRatingAverage && $scope.report.averages.yelpRatingAverage <= 5) {
                $scope.report.averages.yelpRatingAverage = 5;
            }

            $scope.report.averages.googleRatingAverage = Math.round( $scope.report.averages.googleRatingAverage * 1e1 ) / 1e1;

        },
        templateUrl: "/components/reports/reputationReport.html?bust=" + version,
    };
});
