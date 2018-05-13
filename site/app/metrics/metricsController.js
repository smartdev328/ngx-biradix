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

            $scope.widgets = {
                response: {
                    breakdown: ["Minutes", "Hours"],
                    current: "Minutes",
                    total: 0,
                },
                requests: {
                    total: 0,
                },
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
                $scope.runSurveySwapResponded();
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

                    $scope.widgets.requests.total = 0;
                    response.data.result.result.forEach(function(d) {
                        // console.log(d.timeframe.start, d.timeframe.end);
                        s.data.push([((new Date(d.timeframe.start)).getTime() + (new Date(d.timeframe.end)).getTime()) / 2, d.value]);
                        if (_max < d.value) {
                            _max = d.value;
                        }

                        if (_min > d.value) {
                            _min = d.value;
                        }

                        $scope.widgets.requests.total += d.value;
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
                    interval: "daily",
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
                    var dow;
                    var point;
                    response.data.result.result.forEach(function(d) {
                        date = ((new Date(d.timeframe.start)).getTime() + (new Date(d.timeframe.end)).getTime()) / 2;
                        dow = moment(date).format("dddd");
                        switch (dow) {
                            case "Monday":
                                point = moment(date).add(2, "days").startOf("day");
                                monday.data.push([parseInt(moment(point).format("x")), d.value]);
                                break;
                            case "Tuesday":
                                point = moment(date).add(1, "days").startOf("day");
                                tuesday.data.push([parseInt(moment(point).format("x")), d.value]);
                                break;
                            case "Wednesday":
                                point = moment(date).startOf("day");
                                wednesday.data.push([parseInt(moment(point).format("x")), d.value]);
                                break;
                            case "Thursday":
                                point = moment(date).add(-1, "days").startOf("day");
                                thursday.data.push([parseInt(moment(point).format("x")), d.value]);
                                break;
                            case "Friday":
                                point = moment(date).add(-2, "days").startOf("day");
                                friday.data.push([parseInt(moment(point).format("x")), d.value]);
                                break;
                            case "Saturday":
                                point = moment(date).add(-3, "days").startOf("day");
                                saturday.data.push([parseInt(moment(point).format("x")), d.value]);
                                break;
                            case "Sunday":
                                point = moment(date).add(-4, "days").startOf("day");
                                sunday.data.push([parseInt(moment(point).format("x")), d.value]);
                                break;
                        }
                        if (_max < d.value) {
                            _max = d.value;
                        }

                        if (_min > d.value) {
                            _min = d.value;
                        }

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

            $scope.runSurveySwapResponded = function() {
                var parameters = {
                    analyses: {
                        average: {
                            analysis_type: "average",
                            target_property: "responseTimeInMinutes",
                        },
                        count: {
                            analysis_type: "count",
                        },
                    },
                    event_collection: "SurveySwap Responded",
                    interval: $keenService.daterangeToInterval($scope.options.daterange),
                    filters: [
                        {
                            property_name: "env",
                            operator: "eq",
                            property_value: heroku_env,
                        },
                    ],
                    target_property: "",
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

                $scope.widgets.response.total = 0;
                $keenService.query("multi_analysis", parameters).then(function(response) {
                    if (response.data.errors) {
                        return toastr.error("Error: " + response.data.errors.code);
                    }

                    var series = [];
                    var _min = 9999;
                    var _max = 0;
                    var _min2 = 9999;
                    var _max2 = 0;
                    var extremes = [
                        {title: "Responses", min: 0, max: 0},
                        {title: "Avg Response Time", min: 0, max: 0},
                        ];

                    var s2 = {data: [], name: "Responses", yAxis: 0};
                    var s = {data: [], name: "Avg Response Time", yAxis: 1};

                    response.data.result.result.forEach(function(d) {
                        d.value.average = d.value.average || 0;
                        if ($scope.widgets.response.current == "Hours") {
                            d.value.average = d.value.average / 60;
                        }

                        s.data.push([((new Date(d.timeframe.start)).getTime() + (new Date(d.timeframe.end)).getTime()) / 2, d.value.average]);
                        if (_max < d.value.average) {
                            _max = d.value.average;
                        }

                        if (_min > d.value.average) {
                            _min = d.value.average;
                        }

                        s2.data.push([((new Date(d.timeframe.start)).getTime() + (new Date(d.timeframe.end)).getTime()) / 2, d.value.count]);
                        if (_max2 < d.value.count) {
                            _max2 = d.value.count;
                        }

                        if (_min2 > d.value.count) {
                            _min2 = d.value.count;
                        }
                        $scope.widgets.response.total += d.value.count;
                    });

                    if (s.data.length > 0) {
                        extremes[0].min = _min2;
                        extremes[0].max = _max2;
                    }
                    if (s2.data.length > 0) {
                        extremes[1].min = _min;
                        extremes[1].max = _max;
                    }

                    series.push(s2);
                    series.push(s);

                    $scope.responseData = {height: 300, printWidth: 800, decimalPlaces: 0, title: "", marker: true, data: series, extremes: extremes, suffix: "", prefix: ""};

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
