'use strict';
define([
    'app',
    '../../components/dialog/module',
    '../../services/auditService',
    '../../components/filterlist/module.js',
    '../../components/daterangepicker/module',
], function (app) {

    app.controller('historyController', ['$scope','$rootScope','$location','ngProgress','$dialog','$auditService', function ($scope,$rootScope,$location,ngProgress,$dialog,$auditService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";
        $scope.pager = {offset : 0, currentPage: 1, itemsPerPage: 50}
        $scope.limits = [10,50,100,500]
        $scope.typeOptions = { hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Types", labelSelected: "Selected Types", searchLabel: "Types" }
        $scope.daterange={
            Ranges : {
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'Last 90 Days': [moment().subtract(89, 'days'), moment()],
                'Last Year': [moment().subtract(1, 'year'), moment()],
                'Lifetime': [moment().subtract(30, 'year'), moment()],
            },
            selectedRange : "Last 90 Days",
            selectedStartDate : null,
            selectedEndDate : null
        }

        $rootScope.sideMenu = [];
        if ($rootScope.me.permissions.indexOf('Users') > -1) {
            $rootScope.sideMenu.push({label: "Manage Users", href: '#/manageusers', active: false});
        }

        if ($rootScope.me.permissions.indexOf('Properties') > -1) {
            $rootScope.sideMenu.push({label: "Manage Properties", href: '#/properties', active: false});
        }

        if ($rootScope.me.permissions.indexOf('History') > -1) {
            $rootScope.sideMenu.push({label: "Activity History", href: '#/history', active: true});
        }

        $scope.reload = function () {
            $scope.localLoading = false;

            var types = _.pluck(_.filter($scope.typeItems,function(x) {return x.selected == true}),"id");

            $auditService.search({
                skip: $scope.pager.offset, limit: $scope.pager.itemsPerPage, types: types
            }).then(function (response) {
                    $scope.activity = response.data.activity;
                    $scope.pager = response.data.pager;
                    $scope.localLoading = true;
                },
                function (error) {
                    $scope.localLoading = true;
                });
        }

        $auditService.filters().then(function (response) {
                $scope.audits = response.data.audits;

                $scope.typeItems = [];
                $scope.audits.forEach(function(a) {
                    $scope.typeItems.push({id: a.key, name: a.value, selected: !a.excludeDefault})
                })
                $scope.reload();
            },
            function (error) {
                $scope.localLoading = true;
            });



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