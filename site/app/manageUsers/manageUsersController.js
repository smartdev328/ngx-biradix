"use strict";
define([
    "app",
    "../../filters/skip/filter",
], function(app) {
    app.controller("manageUsersController", ["$scope", "$rootScope", "$location", "$userService", "$authService", "ngProgress", "$dialog", "$uibModal", "$gridService", "toastr",
    function($scope, $rootScope, $location, $userService, $authService, ngProgress, $dialog, $uibModal, $gridService, toastr) {
        window.setTimeout(function() {
            window.document.title = "Manage Users | BI:Radix";
            }, 1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Users";

        var siteAdmin;

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                siteAdmin = $rootScope.me.roles.indexOf("Site Admin") > -1;
                $scope.adjustToSize($(window).width());

                $scope.reload();

                me();
            }
        });

        // Grid Options
        $scope.data = [];
        $scope.limits = [10, 50, 100, 500];
        $scope.limit = 50;
        $scope.sort = {date: false};
        $scope.search = {};
        $scope.filters = {active: true};
        $scope.defaultSort = "-date";
        $scope.searchable = ["name", "email", "role", "company"];
        $scope.search["active"] = true;

        $scope.showInactive = false;
        $scope.showActive = true;
        $scope.showDeliverable = true;
        $scope.showUndeliverable = true;

        $scope.adjustToSize = function(size) {
            var isTiny = size < 967;
            $scope.show = {
                rownumber: siteAdmin,
                date: false,
                name: true,
                email: !isTiny,
                role: true,
                company: siteAdmin,
                custom: false,
                active: $scope.showInactive,
                tools: true,
            };
        };

        $scope.$on("size", function(e, size) {
            if (!$scope.columnsChanged) {
                $scope.adjustToSize(size);
            }
        });

        $scope.calcActive = function() {
            if ($scope.showActive === $scope.showInactive) {
                delete $scope.search.active;
            } else {
                $scope.search.active = $scope.showActive;
            }

            if ($scope.showInactive) {
                $scope.show.active = true;
            }

            $scope.resetPager();
        };

        $scope.calcUndeliverable = function() {
            if ($scope.showDeliverable === $scope.showUndeliverable) {
                delete $scope.search.undeliverable;
            } else {
                $scope.search.undeliverable = $scope.showUndeliverable;
            }

            $scope.resetPager();
        };

        $scope.reload = function() {
            $scope.localLoading = false;
            $userService.search().then(function(response) {
                $scope.data = response.data.users;

                var hasRoles = !!$scope.roles;
                if (!hasRoles) {
                    $scope.roles = [];
                }

                var roles;
                $scope.data.forEach(function(x) {
                    roles = _.uniq(_.map(x.roles, function(y) {
                        return y.name;
                    }));
                    x.role = roles.join(", ");
                    x.company = _.map(x.roles, function(y) {
                        return y.org.name;
                    }).join(", ");
                    x.undeliverable = !!x.bounceReason;
                    x.customPropertiesLimit = x.customPropertiesLimit || 0;

                    if (!hasRoles) {
                        $scope.roles = $scope.roles.concat(roles);
                    }
                });

                    // Remove guests from non-admins (filters and data)
                    if ($rootScope.me.permissions.indexOf("Admin") === -1) {
                        _.remove($scope.roles, function(r) {
                            return r.name === "Guest";
                        });

                        _.remove($scope.data, function(r) {
                            return r.role === "Guest";
                        });
                    }

                if (!hasRoles) {
                    $scope.roles = _.sortBy(_.uniq($scope.roles));

                    $scope.roles.forEach(function (r, i) {
                        $scope.roles[i] = {id: r, name: r, selected: r != "Guest"};
                    });

                    $scope.updateRoleFilters();
                }



                $scope.localLoading = true;
            },
            function(error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
                $scope.localLoading = true;
            });
        }

        $scope.updateRoleFilters = function() {
            $scope.selectedRoles = _.map(_.filter($scope.roles, function(x) {return x.selected == true}), function(x) {return x.name})
        }

        $scope.loginAs = function(userid) {
            $authService.loginAs(userid, function (usr, status) {
                if (usr) {
                    // $rootScope.me = usr;
                    // $rootScope.updateLogos();
                    window.location.href = '/';
                }
            })


        }

        $scope.resetPager = function () {
            $scope.currentPage = 1;
        }

        $scope.searchFilter = function (obj) {
            if (!$scope.searchText) return true;
            var re = new RegExp($scope.searchText, 'i');

            var ret = false;
            $scope.searchable.forEach(function (x) {
                if (re.test(obj[x].toString())) {
                    ret = true;
                }
            })
            return ret;
        };

        $scope.roleFilter = function (obj) {
            return $scope.selectedRoles.indexOf(obj.role) > -1;
        };

        $scope.toggleFilter = function (v) {
            $scope.resetPager();
            $gridService.toggle($scope.filters, v, false)
            var s = $scope.filters[v];

            $scope.search = $scope.search || {}
            if (s == null) {
                delete $scope.search[v];
                return;
            }

            $scope.search[v] = s;

        }
        $scope.toggleSort = function (v) {
            $scope.resetPager();
            $gridService.toggle($scope.sort, v, true)

            var s = $scope.sort[v];

            if (s == null) {
                $scope.orderBy = $scope.defaultSort;
                return;
            }

            if (s == true) {
                $scope.orderBy = "-" + v;
            }
            else {
                $scope.orderBy = v;
            }

        }

        $scope.pageStart = function () {
            if ($scope.filtered.length == 0) return 0;
            return (($scope.currentPage || 1) - 1) * parseInt($scope.limit) + 1;
        }

        $scope.pageEnd = function () {
            if ($scope.filtered.length == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.limit);

            if (x > $scope.filtered.length) {
                x = $scope.filtered.length;
            }

            return parseInt(x);
        }

        $scope.download = function () {
            var content = [];
            var header = [];
            if ($scope.show.date) {
                header.push('Date')
            }
            if ($scope.show.name) {
                header.push('Name')
            }
            if ($scope.show.email) {
                header.push('Email')
            }
            if ($scope.show.role) {
                header.push('Role')
            }
            if ($scope.show.company) {
                header.push('Company')
            }
            if ($scope.show.active) {
                header.push('Active')
            }
            content.push(header);
            $scope.filtered.forEach(function (r) {
                var row = [];
                if ($scope.show.date) {
                    row.push(r['date'])
                }
                if ($scope.show.name) {
                    row.push(r['name'])
                }
                if ($scope.show.email) {
                    row.push(r['email'])
                }
                if ($scope.show.role) {
                    row.push(r['role'])
                }
                if ($scope.show.company) {
                    row.push(r['company'])
                }
                if ($scope.show.active) {
                    row.push(r['active'] ? 'Yes' : 'No')
                }
                content.push(row);
            })

            $gridService.streamCsv('users.csv', content)

        }

        $scope.toggleActive = function (user) {
            $dialog.confirm('Are you sure you want to set "' + user.name + '" as ' + (!user.active ? "active" : "inactive") + '?', function() {

            ngProgress.start();

            $userService.setActive(!user.active, user._id).then(function (response) {

                    if (response.data.errors) {
                        toastr.error( _.pluck(response.data.errors,'msg').join("<br>"));
                    }
                    else {
                        user.active = !user.active;

                        if (user.active) {
                            toastr.success(user.name + " has been activated.");
                        } else {
                            toastr.warning(user.name + " has been de-activated. ");
                        }
                    }

                    ngProgress.reset();
                },
                function (error) {
                    toastr.error("Unable to update your account. Please contact the administrator.");
                    ngProgress.reset();
                });
            }, function() {})
        }


        $scope.edit = function (userId) {
            require([
                '/app/manageUsers/editUserController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/manageUsers/editUser.html?bust=' + version,
                    controller: 'editUserController',
                    size: "sm",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        userId: function () {
                            return userId;
                        }
                    }
                });

                modalInstance.result.then(function(newUser) {
                    if (!userId) {
                        toastr.success("<B>" + newUser.first + " " + newUser.last + "</B> has been created successfully. A welcome email has been sent to <B>" + newUser.email + "</B>", "", {timeOut: 10000});
                    } else {
                        toastr.success("<B>" + newUser.first + " " + newUser.last + "</B> updated successfully.");
                    }

                    $scope.reload();
                }, function() {

                });
            });
        }

        $scope.pressed = function(row,event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                $scope.updateCustom(row);
            }
        }

        $scope.updateCustom = function(u) {
            if (u.customPropertiesLimit == u.old_customPropertiesLimit) {
                u.edit = false;
                return;
            }

            $userService.setCustomPropertiesLimit(u._id, u.customPropertiesLimit).then(function (response) {

                    if (response.data.errors) {
                        toastr.error( _.pluck(response.data.errors,'msg').join("<br>"));
                    }
                    else {
                        toastr.success(u.name + " custom property limit has been updated.");
                        u.edit = false;
                    }

                    ngProgress.reset();
                },
                function (error) {
                    toastr.error("Unable to update custom property limit. Please contact the administrator.");
                    ngProgress.reset();
                }
            )
        }

        $scope.focus_box = function(id) {
            window.setTimeout(function() {
                $("#" + id).select();
                $("#" + id).focus();
            }, 300)
        }
    }]);
});