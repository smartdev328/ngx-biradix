'use strict';
define([
    'app',
    '../../filters/skip/filter',
], function (app) {
    app.controller('approvedListsController', ['$scope','$rootScope','$location','$approvedListsService','ngProgress','$dialog','$uibModal','$gridService','toastr', function ($scope,$rootScope,$location,$approvedListsService,ngProgress,$dialog,$uibModal,$gridService,toastr) {
        window.setTimeout(function() {window.document.title = "Approved Lists | BI:Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "ApprovedLists";


        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.types = ["OWNER", "MANAGER"];
        $scope.type = "OWNER";
        $scope.limit = 50;
        $scope.search = {}
        $scope.searchable = ['name', 'type'];

        $scope.typeMap = {"OWNER": "Property:Owner", "MANAGER": "Property:Management"};

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
            },
            function (error) {
                   $scope.localLoading = true;
                toastr.error(error.data.errors[0].message);
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