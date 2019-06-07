angular.module("biradix.global").directive("reputationReport", function() {
    return {
        restrict: "E",
        scope: {
            subject: "=",
            comps: "=",
            report: "=",
        },
        controller: function($scope) {
            $scope.reputation = {
                yelpRating: 0,
                yelpReview: 0,
                yelpCount: 0,
                googleRating: 0,
                googleReview: 0,
                googleCount: 0,
                facebookRating: 0,
                facebookReview: 0,
                facebookCount: 0,
            }

            $scope.report.forEach(function(r){
                if(r.yelp_rating){
                    $scope.reputation.yelpRating += r.yelp_rating;
                    $scope.reputation.yelpReview += r.yelp_count;
                    $scope.reputation.yelpCount += 1;
                }
                if(r.google_rating){
                    $scope.reputation.googleRating += r.google_rating;
                    $scope.reputation.googleReview += r.google_count;
                    $scope.reputation.googleCount += 1;
                }
                if(r.facebook_rating){
                    $scope.reputation.facebookRating += r.facebook_rating;
                    $scope.reputation.facebookReview += r.facebook_count;
                    $scope.reputation.facebookCount += 1;
                }
            });

            console.log($scope.reputation);

        },
        templateUrl: "/components/reports/reputationReport.html?bust=" + version,
    };
});
