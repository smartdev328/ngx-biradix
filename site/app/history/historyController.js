"use strict";
define([
    "app",
    "async",
], function(app, async) {
    app.controller("historyController"
        , ["$scope", "$rootScope", "$location", "ngProgress", "$dialog", "$auditService", "toastr", "$stateParams", "$propertyService", "$userService",
            function($scope, $rootScope, $location, ngProgress, $dialog, $auditService, toastr, $stateParams, $propertyService, $userService) {
        window.setTimeout(function() {
            window.document.title = "Activity History | BI:Radix";
            }, 1500);

        $rootScope.nav = "";
        $scope.pager = {offset: 0, currentPage: 1, itemsPerPage: parseInt($stateParams.rows) || 50};
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
                "Last 30 Days": [moment().subtract(30, "days").startOf("day"), moment().endOf("day")],
                "Last 90 Days": [moment().subtract(90, "days").startOf("day"), moment().endOf("day")],
                "Last 12 Months": [moment().subtract(1, "year").startOf("day"), moment().endOf("day")],
                "Year-to-Date": [moment().startOf("year"), moment().endOf("day")],
                "Lifetime": [moment().subtract(30, "year").startOf("day"), moment().endOf("day")],
            },
            selectedRange: $stateParams.range || "Last 30 Days",
            selectedStartDate: null,
            selectedEndDate: null,
        };

        $scope.options = {search: "", integrityItems: [],
            approvedOptions: ["All", "Approved Only", "Unapproved Only"],
            checked: {},
            checkAll: false,
        };
        $scope.options.approved = $scope.options.approvedOptions[0];
        $rootScope.sideMenu = true;
        $rootScope.sideNav = "History";

        $scope.allowGroupUndo = ["survey_created", "survey_updated", "survey_deleted"];

        $scope.checkAll = function() {
            $scope.activity.forEach(function(a) {
               if (
                   (a.dataIntegrityViolationSet && a.dataIntegrityViolationSet.violations.length > 0 && !a.dataIntegrityViolationSet.approval)
                    || $scope.canGroupUndo(a)
               ) {
                   $scope.options.checked[a._id] = $scope.options.checkAll;
               }
            });
        };

        $scope.canApproveChecked = function() {
            for (var key in $scope.options.checked) {
                if ($scope.options.checked[key] === true) {
                    return true;
                }
            }

            return false;
        };

        $scope.canGroupUndo = function(row) {
            return $scope.allowGroupUndo.indexOf(row.type) > -1 && row.canUndo && $scope.getAudit(row.type).undo && !row.reverted;
        }

        $scope.canUndoChecked = function() {
            var row;
            for (var key in $scope.options.checked) {
                if ($scope.options.checked[key] === true) {
                    row = _.find($scope.activity, function(x) {
                       return x._id.toString() == key.toString();
                    });

                    if ($scope.canGroupUndo(row)) {
                        return true;
                    }
                }
            }
            return false;
        }

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
            });

            return items;
        };

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

        $scope.autocompleteproperties = function(search, callback) {
            $propertyService.search({
                limit: 100,
                permission: ["PropertyManage", "CompManage"],
                active: true,
                search: search,
                skipAmenities: true,
            }).then(function(response) {
                response.data.properties = _.sortBy(response.data.properties, function(x) {
                    return x.name;
                });
                response.data.properties.forEach(function(p) {
                    p.isCustom = !!(p.custom && p.custom.owner);

                    if (p.isCustom) {
                        p.group = " My Custom Properties";
                    } else {
                        p.group = $rootScope.me.orgs[0].name + " Properties";
                    }
                });

                callback(response.data.properties);
            }, function(error) {
                callback([]);
            });
        };

        $scope.reload = function() {
            $scope.options.checked = {};
            $scope.options.checkAll = false;

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
                                if (response.data.properties && response.data.properties.length > 0) {
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
                    window.open("#/history?property=" + row.property.id + "&range=Lifetime&rows=500");
                    break;
                case "User":
                    window.open("#/history?user=" + row.user.id + "&range=Lifetime&rows=500");
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
                            $scope.options.checked[row._id] = false;
                        }
                    },
                    function(error) {
                        toastr.error("Unable to undo. Please contact the administrator." );
                        $scope.localLoading = true;
                    });
            }, function() {

            });
        };

        $scope.undoChecked = function() {
            var good = [];
            var bad = [];
            var row;
            for (var key in $scope.options.checked) {
                if ($scope.options.checked[key] === true) {
                    row = _.find($scope.activity, function(x) {
                        return x._id.toString() == key.toString();
                    });
                    if ($scope.canGroupUndo(row)) {
                        good.push({_id: key, date: (new Date(row.date).getTime())});
                    } else {
                        bad.push(key);
                    }
                }
            }

            var msg = "Are you sure you want to undo <b>" + good.length + "</b> item(s)?";

            if (bad.length > 0) {
                msg += "<Br><Br><span style='color:red'>Note: There are <b>" + bad.length + "</b> item(s) not eligable for group undo.</span>";
            }

            good = _.sortBy(good, function(n) {
                return -1*n.date;
            });

            var successes = 0;
            $dialog.confirm(msg, function() {
                $scope.localLoading = false;
                async.eachSeries(good, function(row, callbacks) {
                    $auditService.undo(row._id).then(function(response) {
                            if (response.data.errors.length > 0) {
                                toastr.error( _.pluck(response.data.errors, "msg").join("<br>"));
                            } else {
                                successes++;
                            }
                            callbacks();
                        },
                        function(error) {
                            toastr.error("Unable to undo. Please contact the administrator." );
                            callbacks();
                        });
                    }, function(err) {
                        toastr.success(successes + " undo(s) performed successfully.");
                        window.setTimeout(function() {
                            $scope.reload();
                            $scope.localLoading = true;
                        }, 1000);
                    }
                );
            });
        }

        $scope.approveChecked = function() {
            var ids = [];
            for (var key in $scope.options.checked) {
                if ($scope.options.checked[key] === true) {
                    ids.push(key);
                }
            }

            $dialog.confirm("Are you sure you want to mark <b>" + ids.length + "</b> item(s) as 'Approved' for Data Integrity Violations?", function() {
                $scope.localLoading = false;
                var success = 0;
                var errors = 0;

                async.eachLimit(ids, 3, function(id, callback) {
                    $auditService.approve(id).then(function(response) {
                        var row = _.find($scope.activity, function(x) {
                            return x._id.toString() == id.toString();
                        });
                            if (response.data.errors && response.data.errors.length > 0) {
                                errors++;
                            } else {
                                row.dataIntegrityViolationSet.approval = {
                                    name: $rootScope.me.first + " " + $rootScope.me.last,
                                    date: new Date(),
                                };
                                success++;
                            }
                            callback();
                        },
                        function(error) {
                            errors++;
                            callback();
                        });
                }, function(err) {
                    if (success > 0) {
                        toastr.success(success + " Data Integrity Violation(s) Approved successfully.");
                    }

                    if (errors > 0) {
                        toastr.success(errors + " Data Integrity Violation(s) had errors.");
                    }

                    $scope.options.checked = {};
                    $scope.options.checkAll = false;

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
                            window.setTimeout(function() {
                                $scope.reload();
                            }, 1000);
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
        };

        $scope.resetPager = function() {
            $scope.pager.offset = 0;
            $scope.reload();
        };

        $scope.pagerChanged = function() {
            $scope.pager.offset = (($scope.pager.currentPage || 1) - 1) * parseInt($scope.pager.itemsPerPage);
            $scope.reload();
        };

        $scope.pageStart = function() {
            if ($scope.pager.count == 0) return 0;
            return (($scope.pager.currentPage || 1) - 1) * parseInt($scope.pager.itemsPerPage) + 1;
        };

        $scope.pageEnd = function() {
            if ($scope.pager.count == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.pager.itemsPerPage);

            if (x > $scope.pager.count) {
                x = $scope.pager.count;
            }

            return parseInt(x);
        };

        $scope.usersDD = {};
        $scope.gotUsersDD = {};
        $scope.getUserDD = function(user) {
            var id = (user.id || user._id).toString();
            if ($scope.usersDD[id]) {
                return $scope.usersDD[id];
            }

            if (!$scope.gotUsersDD[id]) {
                $userService.search({
                    limit: 1,
                    _id: id,
                }).then(function (response) {
                    if (response.data && response.data.users && response.data.users[0]) {
                        $scope.usersDD[id] = "Email: <b>" + response.data.users[0].email + "</b><Br>" +
                            "Role: <b>" + response.data.users[0].roles[0].name + "</b><Br>";
                    } else {
                        $scope.usersDD[id] = "<B>N/A</B>";
                    }
                });

                $scope.gotUsersDD[id] = true;
            }

            return "<center><img src='/images/squares.gif' style='width:40px'></center>";
        };

        $scope.users = {};
        $scope.gotUsers = {};
        $scope.getUser = function(user) {
            var id = (user.id || user._id).toString();
            if ($scope.users[id]) {
                return $scope.users[id];
            }

            if (!$scope.gotUsers[id]) {
                $userService.search({
                    limit: 1,
                    _id: id,
                }).then(function (response) {
                    if (response.data && response.data.users && response.data.users[0]) {
                        $scope.users[id] = "<div class='user-hover'>Organization: <b>" + response.data.users[0].roles[0].org.name + "</b><Br>" +
                             "Email: <b>" + response.data.users[0].email + "</b><Br>" +
                             "Role: <b>" + response.data.users[0].roles[0].name + "</b><Br>" +
                             "History: <A href='#/history?user=" + id + "&range=Lifetime&rows=500' target='_blank'>Click Here</A></div>";
                    } else {
                        $scope.users[id] = "<B>N/A</B>";
                    }
                });

                $scope.gotUsers[id] = true;
            }

            return "<center><img src='/images/squares.gif' style='width:40px'></center>";
        };

        $scope.isOpen = {};

        $scope.openPopup = function($event, id) {
            if ($scope.isOpen[id]) {
                return;
            }

             for (var i in $scope.isOpen) {
                $scope.isOpen[i] = false;
            }

            var el = angular.element($event.toElement);

            el.triggerHandler("click");
        };
    }]);
});
