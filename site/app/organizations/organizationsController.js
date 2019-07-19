'use strict';
define([
    'app',
], function (app) {
    var pageViewType = 'InitialPageView';

    app.controller('organizationsController', ['$scope','$rootScope','$location','$organizationsService','ngProgress','$uibModal','toastr', function ($scope,$rootScope,$location,$organizationsService,ngProgress,$uibModal,toastr) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }

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

                if (ga && pageViewType && timeStart && performance && performance.now) {
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
            function (error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
                $scope.localLoading = true;
            });
        }


        $scope.reload();

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

    }]);
});
