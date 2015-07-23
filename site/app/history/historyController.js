'use strict';
define([
    'app',
    '../../components/dialog/module',
    '../../services/auditService',
], function (app) {

    app.controller('historyController', ['$scope','$rootScope','$location','ngProgress','$dialog','$auditService', function ($scope,$rootScope,$location,ngProgress,$dialog,$auditService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "";
        $scope.pager = {offset : 0, currentPage: 1, itemsPerPage: 50}
        $scope.limits = [1,10,50,100,500]

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
            $auditService.search({
                skip: $scope.pager.offset, limit: $scope.pager.itemsPerPage
            }).then(function (response) {
                    $scope.activity = response.data.activity;
                    $scope.pager = response.data.pager;
                    $scope.audits = response.data.audits;
                    $scope.localLoading = true;
                },
                function (error) {
                    $scope.localLoading = true;
                });
        }

        $scope.reload();

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