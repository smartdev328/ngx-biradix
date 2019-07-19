'use strict';
define([
    'app',
    '../../filters/skip/filter',
], function (app) {
    var pageViewType = 'InitialPageView';

    app.controller('approvedListsController', ['$scope','$rootScope','$location','$approvedListsService','ngProgress','$dialog','$uibModal','$gridService','toastr', function ($scope,$rootScope,$location,$approvedListsService,ngProgress,$dialog,$uibModal,$gridService,toastr) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }

        window.setTimeout(function() {window.document.title = "Approved Lists | BI:Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "ApprovedLists";


        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.types = ["OWNER", "MANAGER", "FEES"];
        $scope.type = "OWNER";
        $scope.limit = 50;
        $scope.search = {}
        $scope.searchable = ['name', 'type'];

        $scope.typeMap = {"OWNER": "Property:Owner", "MANAGER": "Property:Management", "FEES": "Custom Fees & Deposits"};

        // /////////////////////////////
        $scope.reload = function () {
            $scope.localLoading = false;
            $approvedListsService.read({
                "type": $scope.type,
                "limit": 10000,
                "searchableOnly": false,
            }).then(function (response) {
                $scope.data = response.data.data.ApprovedList;
                $scope.localLoading = true;

                if (ga && pageViewType && timeStart && performance && performance.now) {
                    var pageTime = performance.now() - timeStart;

                    var metrics = pageViewType === 'InitialPageView' && {
                        'metric1': 1,
                        'metric2': pageTime,
                    } || {
                        'metric3': 1,
                        'metric4': pageTime,
                    }
            
                    ga('send', 'event', pageViewType, 'Approved Lists', metrics);
            
                    pageViewType = 'PageView';
                }
            },
            function (error) {
                   $scope.localLoading = true;
                toastr.error(error.data.errors[0].message);
            });
        };

        $scope.delete = function(row) {
            $dialog.confirm("Are you sure you want to delete <b>" + row.value + "</b> from <b>" + $scope.typeMap[row.type] + "</b>?", function() {
                $approvedListsService.delete(row.value, row.type).then(function(response) {
                    if (response.data.errors) {
                        toastr.error(response.data.errors[0].message);
                        return;
                    }
                    $scope.reload();
                    toastr.success(row.value + " deleted successfully");
                }, function(error) {
                    toastr.error(error.data.errors[0].message);
                });
            });
        };
        $scope.resetPager = function () {
            $scope.currentPage = 1;
        }
        $scope.reload();

        $scope.pageStart = function () {
            if (!$scope.filtered || $scope.filtered.length == 0) return 0;
            return (($scope.currentPage || 1) - 1) * parseInt($scope.limit) + 1;
        }

        $scope.pageEnd = function () {
            if (!$scope.filtered || $scope.filtered.length == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.limit);

            if (x > $scope.filtered.length) {
                x = $scope.filtered.length;
            }

            return parseInt(x);
        }
    }]);
});
