'use strict';
define([
    'app',
], function (app) {
    var pageViewType = 'InitialPageView';

    app.controller('organizationsController', ['$scope','$rootScope','$location','$organizationsService','$importService','ngProgress','$uibModal','toastr', function ($scope,$rootScope,$location,$organizationsService,$importService,ngProgress,$uibModal,toastr) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }

        window.setTimeout(function() {window.document.title = "Organizations | BI:Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Organizations";

        // /////////////////////////////
        $scope.reload = function (fireGa) {
            $scope.localLoading = false;
            $organizationsService.search({getCounts: true, active: true}).then(function (response) {
                $scope.orgs = response.data.organizations;
                $scope.orgs =  _.sortBy($scope.orgs, function(o) {
                    return o.name;
                });
                $scope.localLoading = true;
                
                $importService.read().then(function(response) {
                    $scope.imports = response.data;
                    $scope.results = [];
                    var pmsImport;
                    
                    $scope.orgs.forEach(function(org) {
                        pmsImport = _.find($scope.imports, function(i) {
                            return i.orgid.toString() === org._id.toString()
                        });
                        if(pmsImport) {
                            Object.assign(pmsImport,{identity: pmsImport.yardi.folder});
                            Object.assign(pmsImport,{orgName: org.name});
                            Object.assign(pmsImport,{orgid: org._id});
                        }
                        $scope.results.push({
                            _id: org._id,
                            name: org.name,  
                            settings: org.settings,
                            sso: org.sso,
                            subdomain: org.subdomain,
                            import: pmsImport,
                            hasPmsImport: pmsImport ? true : false
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
                
                        ga('send', 'event', pageViewType, 'Organizations', metrics);
                
                        pageViewType = 'PageView';
                    }
                },
                function(error) {
                    $scope.localLoading = true;
                });
            },
            function (error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
                $scope.localLoading = true;
            });
        }


        $scope.reload(true);

        $scope.settings = function (organization) {
            require([
                '/app/organizations/defaultSettingsController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/organizations/defaultSettings.html?bust=' + version,
                    controller: 'defaultSettingsController',
                    size: "lg",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        organization: function () {
                            return organization;
                        },

                    }
                });

                modalInstance.result.then(function (mapped) {
                    $scope.reload();
                }, function () {
                    $scope.reload();
                });
            });
        }

        $scope.ssoconfig = function (organization) {
            require([
                '/app/organizations/ssoSettingsController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/organizations/ssoSettings.html?bust=' + version,
                    controller: 'ssoSettingsController',
                    size: 'md',
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        organization: function () {
                            return organization;
                        }
                    }
                });

                modalInstance.result.then(function (mapped) {
                    $scope.reload();
                }, function () {
                    $scope.reload();
                });
            });
        }

        $scope.edit = function(config) {
            var isEdit = config.id === "" ? false : true;
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
                        }
                    }
                });

                modalInstance.result.then(function(newConfig) {
                    var name = newConfig.org + " (" + newConfig.provider +")";
                    if (!isEdit) {
                        toastr.success("<B>" + name + "</B> has been created successfully.", "", {timeOut: 10000});
                    } else {
                        toastr.success("<B>" + name + "</B> updated successfully.");
                    }

                    $scope.reload();
                }, function() {

                });
            });
        }
        $scope.addPMSImport = function (data) {
            var config = {
                id: "",
                isActive: true,
                provider: "YARDI",
                timeZone: "America/Los_Angeles",
                orgid: data.id,
                identity: "",
                orgName: data.name
            };
            $scope.edit(config);
        }

    }]);
});
