'use strict';
define([
    'app',
    '../../components/dialog/module',
    '../../services/auditService',
], function (app) {

    app.controller('historyController', ['$scope','$rootScope','$location','ngProgress','$dialog','$auditService','toastr', function ($scope,$rootScope,$location,ngProgress,$dialog,$auditService,toastr) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        window.setTimeout(function() {window.document.title = "Activity History | BI:Radix";},1500)

        $rootScope.nav = "";
        $scope.pager = {offset : 0, currentPage: 1, itemsPerPage: 50}
        $scope.limits = [10,50,100,500]
        $scope.typeOptions = { noneLabel: 'Any', panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Types", labelSelected: "Selected Types", searchLabel: "Types" }
        $scope.userOptions = { noneLabel: 'Any', panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Users", labelSelected: "Selected Users", searchLabel: "Users" }
        $scope.propertyOptions = { noneLabel: 'Any', panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Properties", labelSelected: "Selected Properties", searchLabel: "Properties" }
        $scope.daterange={
            direction : "right",
            Ranges : {
                'Today': [moment().startOf("day"), moment().endOf("day")],
                'Week to Date': [moment().startOf("week"), moment().endOf("day")],
                'Month to Date': [moment().startOf("month"), moment().endOf("day")],
                'Last 30 Days': [moment().subtract(29, 'days'), moment().endOf("day")],
                'Last 90 Days': [moment().subtract(89, 'days'), moment().endOf("day")],
                'Last Year': [moment().subtract(1, 'year'), moment().endOf("day")],
                'Lifetime': [moment().subtract(30, 'year'), moment().endOf("day")],
            },
            selectedRange : "Last 30 Days",
            selectedStartDate : null,
            selectedEndDate : null
        }

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "History";

        $scope.reload = function () {
            $scope.localLoading = false;

            var types = _.pluck(_.filter($scope.typeItems,function(x) {return x.selected == true}),"id");
            var users = _.pluck(_.filter($scope.userItems,function(x) {return x.selected == true}),"id");
            var properties = _.pluck(_.filter($scope.propertyItems,function(x) {return x.selected == true}),"id");

            $auditService.search({
                skip: $scope.pager.offset, limit: $scope.pager.itemsPerPage
                , types: types
                , users: users
                , properties: properties
                , daterange :
                {
                    daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                    end: $scope.daterange.selectedEndDate
                }
                ,offset : moment().utcOffset()
            }).then(function (response) {
                    $scope.activity = response.data.activity;
                    $scope.pager = response.data.pager;
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

        $auditService.filters().then(function (response) {
                $scope.audits = response.data.audits;

                $scope.typeItems = [];
                $scope.userItems = [];
                $scope.propertyItems = [];

                $scope.audits.forEach(function(a) {
                    $scope.typeItems.push({id: a.key, name: a.value, selected: !a.excludeDefault, group: a.group})
                })

                response.data.users.forEach(function(a) {
                    var u = {id: a._id, name: a.name, selected: false};
                    if ($rootScope.me.permissions.indexOf('Admin') > -1) {
                        u.group = a.company;
                    }
                    $scope.userItems.push(u)
                })

                response.data.properties.forEach(function(a) {
                    $scope.propertyItems.push({id: a._id, name: a.name, selected: false})
                })

                $scope.reload();
            },
            function (error) {
                $scope.localLoading = true;
            });


        $scope.undo = function(row) {
            $dialog.confirm('Are you sure you want to Undo this item?', function() {
                $scope.localLoading = false;

                $auditService.undo(row._id).then(function (response) {
                        if (response.data.errors.length > 0) {
                            toastr.error( _.pluck(response.data.errors,'msg').join("<br>"));
                            $scope.localLoading = true;
                        }
                        else {
                            toastr.success("Undo action performed successfully.");
                            window.setTimeout(function() {$scope.reload();}, 1000);

                        }


                    },
                    function (error) {
                        toastr.error("Unable to undo. Please contact the administrator." );
                        $scope.localLoading = true;
                    });


            }, function() {

            })
        }

        $scope.getAudit = function(key) {
            return _.find($scope.audits, function(x) {return x.key == key})
        }

        $scope.resetPager = function () {
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