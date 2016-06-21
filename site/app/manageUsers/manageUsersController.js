'use strict';
define([
    'app',
    '../../services/userService',
    '../../services/gridService',
    '../../filters/skip/filter',
    '../../components/dialog/module'
], function (app) {

    app.controller('manageUsersController', ['$scope','$rootScope','$location','$userService','$authService','ngProgress','$dialog','$uibModal','$gridService','toastr', function ($scope,$rootScope,$location,$userService,$authService,ngProgress,$dialog,$uibModal,$gridService,toastr) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        window.document.title = "Manage Users | BI:Radix";

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Users";

        var siteAdmin;

        $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                siteAdmin = $rootScope.me.roles.indexOf('Site Admin') > -1;
                $scope.adjustToSize($(window).width());
            }
        })

        var isTiny = $(window).width() < 500;

        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.limit = 50;
        $scope.sort = {date:false}
        $scope.search = {}
        $scope.filters = {active:true}
        $scope.defaultSort = "-date";
        $scope.searchable = ['name', 'email', 'role', 'company'];
        $scope.search['active'] = true;

        $scope.showInactive = false;
        $scope.showActive = true;


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
                active: false,
                tools: true
            }
        }


        $scope.$on('size', function(e,size) {
            if (!$scope.columnsChanged) {
                $scope.adjustToSize(size);
            }
        });

        $scope.calcActive = function() {
            if ($scope.showActive === $scope.showInactive) {
                delete $scope.search.active;
            }
            else
            {
                $scope.search.active = $scope.showActive;
            }

            $scope.resetPager();
        }

        /////////////////////////////
        $scope.reload = function () {
            $scope.localLoading = false;
            $userService.search().then(function (response) {
                $scope.data = response.data.users;
                $scope.localLoading = true;
            },
            function (error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
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

                modalInstance.result.then(function (newUser) {

                    var action = "updated";
                    if (!userId) {
                        action = "created";
                    }
                    toastr.success(newUser.first + " " + newUser.last + " " + action + " successfully.");
                    $scope.reload()
                }, function () {

                });
            });
        }

    }]);
});