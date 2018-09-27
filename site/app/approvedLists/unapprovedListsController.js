'use strict';
define([
    'app',
    '../../filters/skip/filter',
], function (app) {
    app.controller('unapprovedListsController', ['$scope','$rootScope','$location','$propertyService','ngProgress','$dialog','$uibModal','toastr','$stateParams','$approvedListsService', function ($scope,$rootScope,$location,$propertyService,ngProgress,$dialog,$uibModal,toastr,$stateParams,$approvedListsService) {
        window.setTimeout(function() {window.document.title = "Unapproved Queue | BI:Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "";


        //Grid Options
        $scope.data = [];
        $scope.types = ["OWNER", "MANAGER"];
        $scope.type = $stateParams.type || "OWNER";
        $scope.typeMap = {"OWNER": "Property: Owner", "MANAGER": "Property: Management"};

        // /////////////////////////////
        $scope.reload = function() {
            $scope.localLoading = false;
            $propertyService.getUnapproved($scope.type, "frequency {value count} unapproved {id name value}").then(function (response) {
                $scope.data = response.data.data.UnapprovedList;
                $scope.localLoading = true;
            },
            function (error) {
                   $scope.localLoading = true;
                toastr.error(error.data.errors[0].message);
            });
        };

        $scope.updateHash = function() {
            $location.search('type', $scope.type);
        };

        $scope.reload();

        $scope.approve = function(row, searchable) {
            $dialog.confirm("Are you sure you want to approve <b><i>" + $scope.typeMap[$scope.type] + "</i> - " + row.value + "</b> as <b>" + (searchable ? "<span style='color:Green'>Searchable</span>" : "<span style='color:red'>Non-Searchable</span>") + "</b>?<Br>", function() {
                $approvedListsService.create({searchable: searchable, type: $scope.type, value: row.value}).then(function(response) {
                    if (response.data.errors) {
                        toastr.error(response.data.errors[0].message);
                        return;
                    }
                    $scope.reload();
                    toastr.success(row.value + " approved successfully");
                }, function(error) {
                    toastr.error(error.data.errors[0].message);
                });
            });
        };
    }]);
});
