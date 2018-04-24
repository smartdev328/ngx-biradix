define([
    "app",
    "../../services/keenService",
], function(app) {
    app.controller("metricsController", ["$scope", "$rootScope", "$location", "$keenService", "ngProgress", "$uibModal", "toastr", "$cookieSettingsService",
        function($scope, $rootScope, $location, $keenService, ngProgress, $uibModal, toastr, $cookieSettingsService) {
            window.setTimeout(function() {
                window.document.title = "Metrics | BI:Radix";
            }, 1500);

            $rootScope.nav = "";
            $rootScope.sideMenu = false;
            $rootScope.sideNav = "Metrics";

            $scope.options = {
                daterange: $cookieSettingsService.defaultDateObject("30 Days", "", ""),
            };

            var unbind = $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    if ($rootScope.me.permissions.indexOf("Admin") === -1) {
                        return location.href = "/";
                    }

                    $scope.run();
                }
                unbind();
            });

            $scope.run = function() {
                $scope.localLoading = false;
                var parameters = {
                    event_collection: "SurveySwap Requested",
                    interval: "hourly",
                    timeframe: "this_2_days",
                };
                $keenService.query("count", parameters).then(function(response) {
                    $scope.localLoading = true;
                    if (response.data.errors) {
                        return toastr.error("Error: " + response.data.errors.code);
                    }
                    var series = []
                    var min = 0;
                    var max = 0;
                    var _min = 9999;
                    var _max = 0;

                    var s = {data: [], name: "Requests", yAxis: 0};
                    response.data.result.result.forEach(function(d) {
                        s.data.push([(new Date(d.timeframe.start)).getTime(), d.value]);
                        if (_max < d.value) {
                            _max = d.value;
                        }

                        if (_min > d.value) {
                            _min = d.value;
                        }
                    });

                    if (s.data.length > 0) {
                        min = _min;
                        max = _max;
                    }

                    series.push(s);

                    $scope.overallData = {height: 300, printWidth: 800, decimalPlaces: 0, prefix: "", suffix: "", title: "", marker: true, data: series, min: min, max: max};
                }, function(error) {
                    $scope.localLoading = true;
                    toastr.error("Unable to perform action. Please contact an administrator");
                });
            };

            $scope.$watch("options.daterange", function(d, old) {
                if (!$scope.localLoading) return;
                var oldHash = old.selectedStartDate.format("MMDDYYYY") + old.selectedEndDate.format("MMDDYYYY");
                var newHash = d.selectedStartDate.format("MMDDYYYY") + d.selectedEndDate.format("MMDDYYYY");
                if (oldHash === newHash) return;

                $scope.run();
            }, true);
        }]);
});
