'use strict';
define([
    'app',
    '../../filters/skip/filter',
], function (app) {
    app.controller('unapprovedListsController', ['$scope','$rootScope','$location','$propertyService','ngProgress','$dialog','$uibModal','toastr','$stateParams', function ($scope,$rootScope,$location,$propertyService,ngProgress,$dialog,$uibModal,toastr,$stateParams) {
        window.setTimeout(function() {window.document.title = "UnApproved Queue | BI:Radix";},1500);

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
                $scope.data = response.data.data.UnapprovedListQuery;
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
    }]);
});