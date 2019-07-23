"use strict";
define([
    "app",
], function(app) {
    var pageViewType = 'InitialPageView';

    app.controller("importController", ["$scope", "$rootScope", "$location", "$importService", "$organizationsService", "ngProgress", "$dialog", "$uibModal", "toastr",
        function($scope, $rootScope, $location, $importService, $organizationsService, ngProgress, $dialog, $uibModal, toastr) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }

        window.setTimeout(function() {
            window.document.title = "Configure PMS Import | BI:Radix";
            }, 1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Import";


        // /////////////////////////////
        $scope.reload = function(fireGa) {
            $scope.localLoading = false;

            $organizationsService.search().then(function(response) {
                $scope.orgs = response.data.organizations;
                $scope.orgs = _.sortBy($scope.orgs, function(o) {
                    return o.name;
                });
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
                                identity: d.yardi.folder,
                                timeZone: d.timeZone
                            });
                        });

                        $scope.localLoading = true;

                        if (fireGa && ga && pageViewType && timeStart && performance && performance.now) {
                            var pageTime = performance.now() - timeStart;

                            var metrics = pageViewType === 'InitialPageView' && {
                                'metric1': 1,
                                'metric2': pageTime,
                            } || {
                                'metric3': 1,
                                'metric4': pageTime,
                            }
                    
                            ga('send', 'event', pageViewType, 'Import', metrics);
                    
                            pageViewType = 'PageView';
                        }
                    },
                    function(error) {
                        $scope.localLoading = true;
                        toastr.error("Unable to update PMS Config. Please contact the administrator.");
                    });
            },
            function(error) {
                $scope.apiError = true;
                $scope.localLoading = true;
                toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page.");
            });
        };

        $scope.toggleActive = function(row) {
            var name = row.org + " (" + row.provider +")";
            $dialog.confirm("Are you sure you want to set <b>" + name + "</b> as " + (!row.isActive ? "active" : "inactive") + "?", function() {
                ngProgress.start();

                $importService.setActive(!row.isActive, row.id).then(function(response) {
                        row.isActive = !row.isActive;

                        if (row.isActive) {
                            toastr.success(name + " has been activated.");
                        } else {
                            toastr.warning(name + " has been de-activated. ");
                        }

                        ngProgress.reset();
                    },
                    function(error) {
                        if (error.status === 400) {
                            toastr.error(error.data);
                        } else {
                            toastr.error("Unable to update PMS Config. Please contact the administrator.");
                        }

                        ngProgress.reset();
                    });
            }, function() {

            });
        };

        $scope.edit = function(config) {
            require([
                "/app/import/editImportController.js"
            ], function() {
                var modalInstance = $uibModal.open({
                    templateUrl: "/app/import/editImport.html?bust=" + version,
                    controller: "editImportController",
                    size: "sm",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        config: function() {
                            return config;
                        },
                        orgs: function() {
                            return $scope.orgs;
                        }
                    }
                });

                modalInstance.result.then(function(newConfig) {
                    var name = newConfig.org + " (" + newConfig.provider +")";
                    if (!config) {
                        toastr.success("<B>" + name + "</B> has been created successfully.", "", {timeOut: 10000});
                    } else {
                        toastr.success("<B>" + name + "</B> updated successfully.");
                    }

                    $scope.reload();
                }, function() {

                });
            });
        }
        $scope.reload(true);
    }]);
});
