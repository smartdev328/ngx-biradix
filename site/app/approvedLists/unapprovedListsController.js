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

        $scope.data = [];
        $scope.types = ["OWNER", "MANAGER"];
        $scope.type = $stateParams.type || "OWNER";
        $scope.typeMap = {"OWNER": "Property: Owner", "MANAGER": "Property: Management"};

        // /////////////////////////////
        $scope.reload = function() {
            $scope.localLoading = false;
            $propertyService.getUnapproved($scope.type, "frequency {value count} unapproved {id name value}").then(function(response) {
                $scope.data = response.data.data.UnapprovedList;
                $scope.localLoading = true;
            },
            function(error) {
                   $scope.localLoading = true;
                toastr.error(error.data.errors[0].message);
            });
        };

        $scope.updateHash = function() {
            $location.search("type", $scope.type);
        };

        $scope.reload();

        $scope.approve = function(row, searchable) {
            $dialog.confirm("Are you sure you want to approve <b>" + row.value + "</b> as a valid <b>" + $scope.typeMap[$scope.type] + "</b> value <i><u>" + (searchable ? "and add it to the list of autocomplete suggestions" : "without adding it to the list of autocomplete suggestions") + "</u><i>?<Br>", function() {
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

        $scope.edit = function(row) {
            row.typeMap = $scope.typeMap[$scope.type];
            row.type = $scope.type;
            row.newValue = row.value;
            require([
                "/app/approvedLists/editUnapprovedItemController.js",
            ], function() {
                var modalInstance = $uibModal.open({
                    templateUrl: "/app/approvedLists/editUnapprovedItem.html?bust=" + version,
                    controller: "editUnapprovedItemController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        row: function() {
                            return row;
                        },
                    },
                });

                modalInstance.result.then(function (newFloorplans) {
                }, function () {
                    // Cancel

                });
            });
        };
    }]);
});
