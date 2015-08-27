'use strict';
define([
    'app',
    '../../services/userService',
    '../../filters/skip/filter',
    '../../components/dialog/module'
], function (app) {

    app.controller('manageUsersController', ['$scope','$rootScope','$location','$userService','$authService','ngProgress','$dialog','$modal', function ($scope,$rootScope,$location,$userService,$authService,ngProgress,$dialog,$modal) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";

        $rootScope.sideMenu = [];
        if ($rootScope.me.permissions.indexOf('Users') > -1) {
            $rootScope.sideMenu.push({label: "Manage Users", href: '#/manageusers', active: true});
        }

        if ($rootScope.me.permissions.indexOf('Properties') > -1) {
            $rootScope.sideMenu.push({label: "Manage Properties", href: '#/properties', active: false});
        }

        if ($rootScope.me.permissions.indexOf('History') > -1) {
            $rootScope.sideMenu.push({label: "Activity History", href: '#/history', active: false});
        }

        var siteAdmin = $rootScope.me.roles.indexOf('Site Admin') > -1;
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
                    $location.path('/dashboard')
                }
            })


        }

        $scope.resetPager = function () {
            $scope.currentPage = 1;
        }
        $scope.toggle = function (obj, v, reset) {
            var s = obj[v];

            if (reset) {
                for (var i in obj) {
                    if (i != v) {
                        delete obj[i];
                    }
                }
            }

            if (s === true) {
                obj[v] = false
                return;
            }

            if (s === false) {
                obj[v] = null
                return;
            }

            obj[v] = true;

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
            $scope.toggle($scope.filters, v, false)
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
            $scope.toggle($scope.sort, v, true)

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


        $scope.streamCsv = function (filename, content) {
            var finalVal = '';

            for (var i = 0; i < content.length; i++) {
                var value = content[i];

                for (var j = 0; j < value.length; j++) {
                    var innerValue = value[j];
                    var result = innerValue.replace(/"/g, '""');
                    if (result.search(/("|,|\n)/g) >= 0)
                        result = '"' + result + '"';
                    if (j > 0)
                        finalVal += ',';
                    finalVal += result;
                }

                finalVal += '\n';
            }

            var pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal));
            pom.setAttribute('download', filename);
            pom.click();
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

            $scope.streamCsv('users.csv', content)

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
                    $scope.alerts.push({ type: 'success', msg: newUser.First + " " + newUser.Last + " " + action + " successfully."});
                    $scope.reload()
                }, function () {

                });
            });
        }

    }]);
});