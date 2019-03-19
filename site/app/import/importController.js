"use strict";
define([
    "app",
], function(app) {
    app.controller("importController", ["$scope", "$rootScope", "$location", "$importService", "$organizationsService", "ngProgress", "$dialog", "$uibModal", "toastr",
        function($scope, $rootScope, $location, $importService, $organizationsService, ngProgress, $dialog, $uibModal, toastr) {
        window.setTimeout(function() {
            window.document.title = "Configure PMS Import | BI:Radix";
            }, 1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Import";

        // /////////////////////////////
        $scope.reload = function() {
            $scope.localLoading = false;

            $organizationsService.search().then(function(response) {
                $scope.orgs = response.data.organizations;
                $importService.read().then(function(response) {
                        $scope.data = response.data;
                        $scope.results = [];
                        var org;
                        response.data.forEach(function(d) {
                            org = _.find($scope.orgs, function(o) {
                                return o._id.toString() === d.orgid.toString();
                            });
                            $scope.results.push({
                                id: d.id,
                                orgid: d.orgid,
                                org: org.name,
                                provider: d.provider,
                                isActive: d.isActive,
                                identity: d.yardi.folder
                            });
                        });

                        console.log($scope.results);
                        $scope.localLoading = true;
                    },
                    function(error) {
                        $scope.localLoading = true;
                        toastr.error("Error");
                    });
            });
        };

        $scope.reload();
    }]);
});
