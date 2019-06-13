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

            $scope.$watch('report.averages.yelpRatingAverage', function(newvalue) {
                newvalue = parseFloat(newvalue.toFixed(1));
                if(0.5 <= newvalue && newvalue <= 1.2) {
                    $scope.report.averages.yelpRatingAverage = 1;
                } else if(1.3 <= newvalue && newvalue <= 1.7) {
                    $scope.report.averages.yelpRatingAverage = 1.5;
                } else if(1.8 <= newvalue && newvalue <= 2.2) {
                    $scope.report.averages.yelpRatingAverage = 2;
                } else if(2.3 <= newvalue && newvalue <= 2.7) {
                    $scope.report.averages.yelpRatingAverage = 2.5;
                } else if(2.8 <= newvalue && newvalue <= 3.2) {
                    $scope.report.averages.yelpRatingAverage = 3;
                } else if(3.3 <= newvalue && newvalue <= 3.7) {
                    $scope.report.averages.yelpRatingAverage = 3.5;
                } else if(3.8 <= newvalue && newvalue <= 4.2) {
                    $scope.report.averages.yelpRatingAverage = 4;
                } else if(4.3 <= newvalue && newvalue <= 4.7) {
                    $scope.report.averages.yelpRatingAverage = 4.5;
                } else if(4.8 <= newvalue && newvalue <= 5) {
                    $scope.report.averages.yelpRatingAverage = 5;
                }
            });

        },
        templateUrl: "/components/reports/reputationReport.html?bust=" + version,
    };
});
