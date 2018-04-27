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

            $scope.getDateRange = function() {
                return {
                    Ranges: {
                        "Today": [moment().startOf("day"), moment().endOf("day")],
                        "Yesterday": [moment().subtract(1, "day").startOf("day"), moment().subtract(1, "day").endOf("day")],
                        "Week to Date": [moment().startOf("isoweek"), moment().endOf("day")],
                        "Last 7 Days": [moment().subtract(7, "days").startOf("day"), moment().endOf("day")],
                        "Month to Date": [moment().startOf("month"), moment().endOf("day")],
                        "Month to Yesterday": [moment().startOf("month"), moment().subtract(1, "day").endOf("day")],
                        "Last 30 Days": [moment().subtract(30, "days").startOf("day"), moment().endOf("day")],
                        "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
                        "Year to Date": [moment().startOf("year"), moment().endOf("day")],
                        "Last 12 Months": [moment().subtract(12, "months").startOf("day"), moment().endOf("day")],
                    },
                    selectedRange: "Last 30 Days",
                    selectedStartDate: null,
                    selectedEndDate: null,
                };
            };

            $scope.options = {
                daterange: $scope.getDateRange(),
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
                $scope.runSurveySwapRequestedByWeekday();
            };

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
                    if (response.data.errors) {
                        return toastr.error("Error: " + response.data.errors.code);
                    }

                    response.data.result.result = _.sortBy(response.data.result.result, function(x) {
                        return -1*x.result;
                    });

                    var series = [{name: "Requests", data: []}];
                    response.data.result.result.forEach(function(d) {
                        series[0].data.push([d["user.organization.name"], d.result]);
                        if (d.result > max) {
                            max = d.result.result;
                        }
                    });

                    $scope.orgData = {
                        yLabel: "",
                        height: 300,
                        data: series,
                    };
                }, function(error) {
                    toastr.error("Unable to perform action. Please contact an administrator");
                });
            };

            $scope.runSurveySwapRequestedByWeekday = function() {
                var parameters = {
                    event_collection: "SurveySwap Requested",
                    interval: "weekly",
                    filters: [
                        {
                            property_name: "env",
                            operator: "eq",
                            property_value: heroku_env,
                        },
                    ],
                    group_by: "timestamp_info.day_of_week_string",
                    timeframe: $keenService.daterangeToTtimeframe($scope.options.daterange),
                };

                var orgs = _.map(_.filter($scope.options.organizationItems, function(x) {
                    return x.selected === true;
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

                    var monday = {data: [], name: "Monday", yAxis: 0};
                    var tuesday = {data: [], name: "Tuesday", yAxis: 0};
                    var wednesday = {data: [], name: "Wednesday", yAxis: 0};
                    var thursday = {data: [], name: "Thursday", yAxis: 0};
                    var friday = {data: [], name: "Friday", yAxis: 0};
                    var saturday = {data: [], name: "Saturday", yAxis: 0};
                    var sunday = {data: [], name: "Sunday", yAxis: 0};
                    var date;
                    var hasData = false;
                    var minmax = {};

                    response.data.result.result.forEach(function(d) {
                        date = ((new Date(d.timeframe.start)).getTime() + (new Date(d.timeframe.end)).getTime()) / 2;
                        minmax = $scope.parseWeekday(monday, date, d, _min, _max);
                        _min = minmax._min;
                        _max = minmax._max;
                        minmax = $scope.parseWeekday(tuesday, date, d, _min, _max);
                        _min = minmax._min;
                        _max = minmax._max;
                        minmax = $scope.parseWeekday(wednesday, date, d, _min, _max);
                        _min = minmax._min;
                        _max = minmax._max;
                        minmax = $scope.parseWeekday(thursday, date, d, _min, _max);
                        _min = minmax._min;
                        _max = minmax._max;
                        minmax = $scope.parseWeekday(friday, date, d, _min, _max);
                        _min = minmax._min;
                        _max = minmax._max;
                        minmax = $scope.parseWeekday(saturday, date, d, _min, _max);
                        _min = minmax._min;
                        _max = minmax._max;
                        minmax = $scope.parseWeekday(sunday, date, d, _min, _max);
                        _min = minmax._min;
                        _max = minmax._max;
                        hasData = true;
                    });

                    if (hasData) {
                        min = _min;
                        max = _max;
                    }

                    series.push(monday);
                    series.push(tuesday);
                    series.push(wednesday);
                    series.push(thursday);
                    series.push(friday);
                    series.push(saturday);
                    series.push(sunday);

                    $scope.weekdayData = {height: 300, printWidth: 800, decimalPlaces: 0, prefix: "", suffix: "", title: "", marker: true, data: series, min: min, max: max};
                });
            };

            $scope.parseWeekday = function(series, date, row, _min, _max) {
                var value = _.find(row.value, function(x) {
                    return x["timestamp_info.day_of_week_string"] === series.name;
                }) || {result: 0};
                value = value.result;

                series.data.push([date, value]);

                if (_max < value) {
                    _max = value;
                }

                if (_min > value) {
                    _min = value;
                }

                return {_min: _min, max: _max};
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
