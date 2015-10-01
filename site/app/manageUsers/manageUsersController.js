'use strict';
define([
    'app',
    '../../services/userService',
    '../../services/gridService',
    '../../filters/skip/filter',
    '../../components/dialog/module'
], function (app) {

    app.controller('manageUsersController', ['$scope','$rootScope','$location','$userService','$authService','ngProgress','$dialog','$modal','$gridService', function ($scope,$rootScope,$location,$userService,$authService,ngProgress,$dialog,$modal,$gridService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Users";

        var siteAdmin;

        $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                siteAdmin = $rootScope.me.roles.indexOf('Site Admin') > -1;
            }
        })

        var isTiny = $(window).width() < 500;

        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.limit = 50;
        $scope.sort = {}
        $scope.search = {}
        $scope.filters = {active:true}
        $scope.defaultSort = "-date";
        $scope.searchable = ['name', 'email', 'role', 'company'];
        $scope.search['active'] = true;

        $scope.adjustToSize = function(size) {
            var isTiny = size < 967;
            var isMedium = size < 1167;
            $scope.show = {
                rownumber: siteAdmin,
                date: false,
                name: true,
                email: !isTiny,
                role: true,
                company: siteAdmin,
                active: !isTiny,
                tools: true
            }
        }

        $scope.adjustToSize($(window).width());

        $scope.$on('size', function(e,size) {
            if (!$scope.columnsChanged) {
                $scope.adjustToSize(size);
            }
        });

        /////////////////////////////
        $scope.reload = function () {
            $scope.localLoading = false;
            $userService.search().then(function (response) {
                    $scope.data = response.data.users;
                      $scope.localLoading = true;
                },
                function (error) {
                    $scope.localLoading = true;
                });
        }

        $scope.reload();

        $scope.loginAs = function(userid) {
            $authService.loginAs(userid, function (usr, status) {
                if (usr) {
                    $rootScope.me = usr;
                    $rootScope.updateLogos();
                    $location.path('/dashboard')
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
            $scope.alerts = [];

            ngProgress.start();

            $userService.setActive(!user.active, user._id).then(function (response) {

                    if (response.data.errors) {
                        $scope.alerts.push({ type: 'danger', msg: _.pluck(response.data.errors,'msg').join("<br>") });
                    }
                    else {
                        user.active = !user.active;

                        if (user.active) {
                            $scope.alerts.push({type: 'success', msg: user.name + " has been activated."});
                        } else {
                            $scope.alerts.push({type: 'warning', msg: user.name + " has been de-activated. "});
                        }
                    }

                    ngProgress.reset();
                },
                function (error) {
                    $scope.alerts.push({ type: 'danger', msg: "Unable to update your account. Please contact the administrator." });
                    ngProgress.reset();
                });
            }, function() {})
        }


        $scope.edit = function (userId) {
            require([
                '/app/manageUsers/editUserController.js'
            ], function () {
                var modalInstance = $modal.open({
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

                modalInstance.result.then(function (newUser) {

                    var action = "updated";
                    if (!userId) {
                        action = "created";
                    }
                    $scope.alerts = [];
                    $scope.alerts.push({ type: 'success', msg: newUser.first + " " + newUser.last + " " + action + " successfully."});
                    $scope.reload()
                }, function () {

                });
            });
        }

    }]);
});