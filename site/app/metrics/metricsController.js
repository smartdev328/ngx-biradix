define([
    "app",
    "../../services/organizationsService",
], function(app) {
    app.controller("metricsController", ["$scope", "$rootScope", "$location", "$keenService", "ngProgress", "$uibModal", "toastr", "$cookieSettingsService", "$organizationsService",
        function($scope, $rootScope, $location, $keenService, ngProgress, $uibModal, toastr, $cookieSettingsService, $organizationsService) {
            window.setTimeout(function() {
                window.document.title = "Metrics | BI:Radix";
            }, 1500);

            $rootScope.nav = "";
            $rootScope.sideMenu = false;
            $rootScope.sideNav = "Metrics";

            $scope.options = {
                daterange: $cookieSettingsService.defaultDateObject("30 Days", "", ""),
                organizationOptions: {hideSearch: false, dropdown: true, dropdownDirection: "left", labelAvailable: "Available", labelSelected: "Selected", searchLabel: "Organizations"},
                organizationItems: [],
            };

            var unbind = $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    if ($rootScope.me.permissions.indexOf("Admin") === -1) {
                        return location.href = "/";
                    }
                    $scope.runOrganizations();
                    $scope.runAll();
                }
                unbind();
            });

            $scope.runOrganizations = function() {
                $scope.localLoading = false;
                $organizationsService.search().then(function(response) {
                    response.data.organizations.forEach(function(o) {
                        $scope.options.organizationItems.push({id: o._id, name: o.name, selected: false});
                    });
                    $scope.localLoading = true;
                });
            };

            $scope.runAll = function() {
                $scope.runSurveySwapRequested();
                $scope.runSurveySwapRequestedByOrganization();
            }

            $scope.runSurveySwapRequested = function() {
                var parameters = {
                    event_collection: "SurveySwap Requested",
                    interval: $keenService.daterangeToInterval($scope.options.daterange),
                    filters: [
                        {
                            property_name: "env",
                            operator: "eq",
                            property_value: heroku_env,
                        },
                    ],
                    timeframe: $keenService.daterangeToTtimeframe($scope.options.daterange),
                };

                var orgs = _.map(_.filter($scope.options.organizationItems, function(x) {
                    return x.selected == true;
                }), function(x) {
                    return x.id;
                });

                if (orgs.length > 0) {
                    parameters.filters.push({
                        property_name: "user.organization.id",
                        operator: "in",
                        property_value: orgs,
                    });
                }

                $keenService.query("count", parameters).then(function(response) {
                    if (response.data.errors) {
                        return toastr.error("Error: " + response.data.errors.code);
                    }

                    var series = [];
                    var min = 0;
                    var max = 0;
                    var _min = 9999;
                    var _max = 0;

                    var s = {data: [], name: "Requests", yAxis: 0};
                    response.data.result.result.forEach(function(d) {
                        // console.log(d.timeframe.start, d.timeframe.end);
                        s.data.push([((new Date(d.timeframe.start)).getTime() + (new Date(d.timeframe.end)).getTime()) / 2, d.value]);
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
                    toastr.error("Unable to perform action. Please contact an administrator");
                });
            };

            $scope.runSurveySwapRequestedByOrganization = function() {
                var parameters = {
                    event_collection: "SurveySwap Requested",
                    group_by: "user.organization.name",
                    filters: [
                        {
                            property_name: "env",
                            operator: "eq",
                            property_value: heroku_env,
                        },
                    ],
                    timeframe: $keenService.daterangeToTtimeframe($scope.options.daterange),
                };

                $keenService.query("count", parameters).then(function(response) {

                    var series = [];
                    var categories = [];
                    var values = [];
                    response.data.result.result.forEach(function(d) {
                        categories.push(d["user.organization.name"]);
                        values.push(d.result);
                    })

                    series.push({name: "Requests", data: values});


                    $scope.orgData = {
                        yLabel: "",
                        height: 300,
                        data: series,
                        categories: categories,
                    };
                }, function(error) {
                    toastr.error("Unable to perform action. Please contact an administrator");
                });
            };

            $scope.$watch("options.daterange", function(d, old) {
                if (!$scope.localLoading) return;
                var oldHash = old.selectedStartDate.format("MMDDYYYY") + old.selectedEndDate.format("MMDDYYYY");
                var newHash = d.selectedStartDate.format("MMDDYYYY") + d.selectedEndDate.format("MMDDYYYY");
                if (oldHash === newHash) return;

                $scope.runAll();
            }, true);

            $scope.$watch("options.organizationItems", function(n, old) {
                if (!$scope.localLoading) return;

                var oldHash = _.map(_.filter(old, function(x) {
                    return x.selected == true;
                }), function(x) {
                    return x.id;
                });
                var newHash = _.map(_.filter(n, function(x) {
                    return x.selected == true;
                }), function(x) {
                    return x.id;
                });

                if (JSON.stringify(oldHash) === JSON.stringify(newHash)) return;

                $scope.runAll();
            }, true);
        }]);
});
