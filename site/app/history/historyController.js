"use strict";
define([
    "app",
], function(app) {
    app.controller("historyController"
        , ["$scope", "$rootScope", "$location", "ngProgress", "$dialog", "$auditService", "toastr", "$stateParams", "$propertyService", "$userService",
            function($scope, $rootScope, $location, ngProgress, $dialog, $auditService, toastr, $stateParams, $propertyService, $userService) {
        window.setTimeout(function() {
            window.document.title = "Activity History | BI:Radix";
            }, 1500);

        $rootScope.nav = "";
        $scope.pager = {offset: 0, currentPage: 1, itemsPerPage: 50};
        $scope.limits = [10, 50, 100, 500];
        $scope.typeOptions = {noneLabel: "Any", panelWidth: 210, minwidth: "100%", hideSearch: false, dropdown: true, dropdownDirection: "left", labelAvailable: "Available Types", labelSelected: "Selected Types", searchLabel: "Types"};
        $scope.integrityOptions = {noneLabel: "Any", panelWidth: 210, minwidth: "100%", hideSearch: false, dropdown: true, dropdownDirection: "right", labelAvailable: "Available", labelSelected: "Selected", searchLabel: "Violations"};
        $scope.userOptions = {noneLabel: "Any", panelWidth: 210, minwidth: "100%", hideSearch: false, dropdown: true, dropdownDirection: "right", labelAvailable: "Available Users", labelSelected: "Selected Users", searchLabel: "Users"};
        $scope.propertyOptions = {noneLabel: "Any", panelWidth: 210, minwidth: "100%", hideSearch: false, dropdown: true, dropdownDirection: "right", labelAvailable: "Available Properties", labelSelected: "Selected Properties", searchLabel: "Properties"};
        $scope.daterange={
            direction: "right",
            Ranges: {
                "Today": [moment().startOf("day"), moment().endOf("day")],
                "Week to Date": [moment().startOf("week"), moment().endOf("day")],
                "Month to Date": [moment().startOf("month"), moment().endOf("day")],
                "30 Days": [moment().subtract(30, "days").startOf("day"), moment().endOf("day")],
                "90 Days": [moment().subtract(90, "days").startOf("day"), moment().endOf("day")],
                "12 Months": [moment().subtract(1, "year").startOf("day"), moment().endOf("day")],
                "Year-to-Date": [moment().startOf("year"), moment().endOf("day")],
                "Lifetime": [moment().subtract(30, "year").startOf("day"), moment().endOf("day")],
            },
            selectedRange: $stateParams.date1 ? "Custom Range" : "30 Days",
            selectedStartDate: $stateParams.date1 || null,
            selectedEndDate: $stateParams.date2 || null,
        };

        $scope.options = {search: "", integrityItems: [], approvedOptions: ["All", "Approved Only", "Unapproved Only"]};
        $scope.options.approved = $scope.options.approvedOptions[0];
        $rootScope.sideMenu = true;
        $rootScope.sideNav = "History";

        $scope.formatUsers = function(data) {
            var u;
            var u2;
            var items = [];

            data.users.forEach(function(a) {
                u = {id: a._id, name: a.name};
                if ($rootScope.me.permissions.indexOf("Admin") > -1) {
                    a.roles.forEach(function(r) {
                        u2 = _.cloneDeep(u);
                        if (r.name == "Guest") {
                            u2.group = "Guests";
                        } else {
                            u2.group = r.org.name;
                        }
                        items.push(u2);
                    });
                } else {
                    items.push(u);
                }
            })
            return items;
        }

        $scope.autocompleteusers = function(search, callback) {
            $userService.search({
                limit: 100,
                active: true,
                search: search,
            }).then(function(response) {
                callback($scope.formatUsers(response.data));
            }, function(error) {
                callback([]);
            });
        };

        $scope.autocompleteproperties = function(search,callback) {
            $propertyService.search({
                limit: 100,
                permission: ['PropertyManage', 'CompManage'],
                active: true,
                search: search
                , skipAmenities: true
            }).then(function (response) {

                response.data.properties = _.sortBy(response.data.properties, function(x) {return x.name});
                response.data.properties.forEach(function(p) {
                    p.isCustom = !!(p.custom && p.custom.owner);

                    if (p.isCustom) {
                        p.group = " My Custom Properties";
                    } else {
                        p.group = $rootScope.me.orgs[0].name + " Properties";
                    }
                })

                callback(response.data.properties);
            }, function(error) {
                callback([]);
            });
        }

        $scope.reload = function() {
            $scope.localLoading = false;

            var types = _.pluck(_.filter($scope.typeItems, function(x) {
                return x.selected == true;
            }), "id");
            var users = _.pluck($scope.userItems, "id");
            var properties = _.pluck($scope.propertyItems, "id");
            var dataIntegrityTypes = _.pluck(_.filter($scope.options.integrityItems, function(x) {
                return x.selected == true;
            }), "id");

            var approved = null;
            if ($scope.options.approved == "Approved Only") {
                approved = true;
            } else if ($scope.options.approved == "Unapproved Only") {
                approved = false;
            }

            $auditService.search({
                skip: $scope.pager.offset,
                limit: $scope.pager.itemsPerPage,
                types: types,
                dataIntegrityTypes: dataIntegrityTypes,
                users: users,
                properties: properties,
                search: $scope.options.search,
                approved: approved,
                daterange: {
                    daterange: $scope.daterange.selectedRange,
                    start: $scope.daterange.selectedStartDate,
                    end: $scope.daterange.selectedEndDate,
                },
                offset: moment().utcOffset(),
            }).then(function(response) {
                    $scope.activity = response.data.activity;

                    // Join violation on integrity check
                    if ($scope.dataIntegrityChecks && $scope.dataIntegrityChecks.length > 0) {
                        $scope.activity.forEach(function(a) {
                            a.severity = a.severity || 999;

                            if (a.dataIntegrityViolationSet && a.dataIntegrityViolationSet.violations) {
                                a.dataIntegrityViolationSet.violations.forEach(function(v) {
                                  v.dataIntegrityCheck = _.find($scope.dataIntegrityChecks, function(x) {
                                      return x.type==v.checkType;
                                  });
                                  if (v.dataIntegrityCheck.severity < a.severity) {
                                      a.severity = v.dataIntegrityCheck.severity;
                                  }
                                });

                                a.dataIntegrityViolationSet.violations = _.sortBy(a.dataIntegrityViolationSet.violations, function(x) {
                                    return x.dataIntegrityCheck.severity;
                                });
                            }
                        });
                    }

                    $scope.pager = response.data.pager;
                    $scope.localLoading = true;
                },
                function(error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }
                    $scope.localLoading = true;
                });
        };

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();

                $auditService.filters().then(function(response) {
                        $scope.audits = response.data.audits;
                        $scope.dataIntegrityChecks = response.data.dataIntegrityChecks;

                        $scope.typeItems = [];
                        $scope.userItems = [];
                        $scope.propertyItems = [];
                        $scope.options.integrityItems = [];

                        $scope.audits.forEach(function(a) {
                            $scope.typeItems.push({id: a.key, name: a.value, selected: !a.excludeDefault, group: a.group});
                        });

                        $scope.dataIntegrityChecks.forEach(function(a) {
                            $scope.options.integrityItems.push({id: a.type, name: a.name, selected: false, group: a.severity == 1 ? "  High" : (a.severity == 2 ? " Medium" : "Low")});
                        });

                        $scope.typeItems = _.sortBy($scope.typeItems, function(x) {
                            return (x.group || "") + x.name.toLowerCase();
                        });

                        if ($stateParams.active) {
                            $scope.options.approved = $scope.options.approvedOptions[2];
                        }

                        if (!$stateParams.property && !$stateParams.user) {
                            $scope.reload();
                        } else if ($stateParams.property) {
                            $propertyService.search({
                                limit: 1,
                                permission: ["PropertyManage", "CompManage"],
                                active: true,
                                _id: $stateParams.property,
                                skipAmenities: true,
                            }).then(function(response) {
                                if (response.data.properties || response.data.properties.length > 0) {
                                    $scope.propertyItems.push({id: $stateParams.property, name: response.data.properties[0].name});
                                }

                                $scope.reload();
                            }, function(error) {
                                $scope.reload();
                            });
                        } else if ($stateParams.user) {
                            $userService.search({
                                limit: 1,
                                _id: $stateParams.user,
                            }).then(function(response) {
                                $scope.userItems = $scope.formatUsers(response.data);
                                $scope.reload();
                            }, function(error) {
                                $scope.reload();
                            });
                        }
                    },
                    function(error) {
                        $scope.localLoading = true;
                    });
            }
        });

        $scope.proximity = function(row) {
            var date2 = moment(row.date).add(30, "day").format("YYYY-MM-DD");
            var date1 = moment(row.date).subtract(1, "day").format("YYYY-MM-DD");
            switch (row.dataIntegrityViolationSet.violations[0].dataIntegrityCheck.searchParameter) {
                case "Property":
                    window.open("#/history?property=" + row.property.id + "&date1=" + date1 + "&date2=" + date2);
                    break;
                case "User":
                    window.open("#/history?user=" + row.user.id + "&date1=" + date1 + "&date2=" + date2);
                    break;
                default:
                    throw new Error("Not implemented");
            };
        };

        $scope.getDataIntegrityColor = function(severity, approval) {
            if ($rootScope.me.permissions.indexOf("Admin") == -1 || severity == 999) {
                return "inherit";
            }

            if (approval) {
                return "lightgreen";
            }

            if (severity == 1) {
                return "lightpink";
            }

            if (severity == 2) {
                return "orange";
            }

            if (severity == 3) {
                return "#d9edf7";
            }
            return "inherit";
        };

        $scope.approve = function(row) {
            $dialog.confirm("Are you sure you want to mark this item as 'Approved' for Data Integrity Violations?", function() {
                $scope.localLoading = false;

                $auditService.approve(row._id).then(function(response) {
                        if (response.data.errors && response.data.errors.length > 0) {
                            toastr.error( _.pluck(response.data.errors, "msg").join("<br>"));
                            $scope.localLoading = true;
                        } else {
                            toastr.success("Data Integrity Violations Approved successfully.");
                            row.dataIntegrityViolationSet.approval = {
                                name: $rootScope.me.first + " " + $rootScope.me.last,
                                date: new Date(),
                            };
                            $scope.localLoading = true;
                        }
                    },
                    function(error) {
                        toastr.error("Unable to undo. Please contact the administrator." );
                        $scope.localLoading = true;
                    });
            }, function() {

            });
        };

        $scope.undo = function(row) {
            $dialog.confirm("Are you sure you want to Undo this item?", function() {
                $scope.localLoading = false;

                $auditService.undo(row._id).then(function(response) {
                        if (response.data.errors.length > 0) {
                            toastr.error( _.pluck(response.data.errors, "msg").join("<br>"));
                            $scope.localLoading = true;
                        } else {
                            toastr.success("Undo action performed successfully.");
                            window.setTimeout(function() {$scope.reload();}, 1000);
                        }
                    },
                    function(error) {
                        toastr.error("Unable to undo. Please contact the administrator." );
                        $scope.localLoading = true;
                    });
            }, function() {

            });
        };

        $scope.getAudit = function(key) {
            return _.find($scope.audits, function(x) {
                return x.key == key;
            });
        }

        $scope.resetPager = function() {
            $scope.pager.offset = 0;
            $scope.reload();
        }

        $scope.pagerChanged = function() {
            $scope.pager.offset = (($scope.pager.currentPage || 1) - 1) * parseInt($scope.pager.itemsPerPage)
            $scope.reload();
        }

        $scope.pageStart = function () {
            if ($scope.pager.count == 0) return 0;
            return (($scope.pager.currentPage || 1) - 1) * parseInt($scope.pager.itemsPerPage) + 1;
        }

        $scope.pageEnd = function () {
            if ($scope.pager.count == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.pager.itemsPerPage);

            if (x > $scope.pager.count) {
                x = $scope.pager.count;
            }

            return parseInt(x);
        }
    }]);
});