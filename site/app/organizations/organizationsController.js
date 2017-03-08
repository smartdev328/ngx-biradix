'use strict';
define([
    'app',
    '../../services/organizationsService',
], function (app) {

    app.controller('organizationsController', ['$scope','$rootScope','$location','$organizationsService','ngProgress','$uibModal','toastr', function ($scope,$rootScope,$location,$organizationsService,ngProgress,$uibModal,toastr) {
        window.setTimeout(function() {window.document.title = "Organizations | BI:Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Organizations";



        // /////////////////////////////
        $scope.reload = function () {
            $scope.localLoading = false;
            $organizationsService.search({getCounts: true, active: true}).then(function (response) {
                $scope.data = response.data.organizations;
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

    }]);
});