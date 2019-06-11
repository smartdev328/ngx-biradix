angular.module("biradix.global").directive("reputationReport", function() {
    return {
        restrict: "E",
        scope: {
            subject: "=",
            comps: "=",
            report: "=",
        },
        controller: function($scope) {

        },
        templateUrl: "/components/reports/reputationReport.html?bust=" + version,
    };
});
