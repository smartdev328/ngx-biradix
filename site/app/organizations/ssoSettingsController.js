'use strict';

define([
    'app',
    '../../services/cronService.js',
], function (app) {
    app.controller(
        'ssoSettingsController',
        [
            '$scope',
            '$uibModalInstance',
            'organization',
            'ngProgress',
            '$rootScope',
            '$userService',
            '$organizationsService',
            'toastr',
            function ($scope, $uibModalInstance, organization, ngProgress, $rootScope, $userService, $organizationsService, toastr) {
                ga('set', 'title', '/ssoSettings');
                ga('set', 'page', '/ssoSettings');
                ga('send', 'pageview');

                // sso
                $scope.SSOList = {};
                $scope.SSOList.data = [
                    {
                        name: 'not use',
                        id: undefined,
                    },
                    {
                        name: 'Azure',
                        id: 'azure',
                    },
                    {
                        name: 'Okta',
                        id: 'okta',
                    },
                ];

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };

                $scope.apply = function(setting) {

                };

                // tabs
                $scope.tabs = [
                    {
                        label: 'SSO Parameters',
                        template: 'ssoParameters.html',
                    },
                    {
                        label: 'User Config',
                        template: 'userConfig.html',
                    },
                ];
                $scope.changeTab = function (index) {
                    $scope.tabIndex = index;
                    $scope.tabTemplate = '/app/organizations/tabs/' + $scope.tabs[index].template + '?bust=' + version;
                    ga('set', 'title', '/ssoSettings/' +  $scope.tabs[index].label);
                    ga('set', 'page', '/ssoSettings/' +  $scope.tabs[index].label);
                    ga('send', 'pageview');
                }
                $scope.changeTab(0);

                // load data
                $scope.reload = function () {
                    $organizationsService.search().then(function (response) {
                        $scope.organization = response.data.organizations.find((function (item, index) {
                            return item._id == organization._id;
                        }));
                        $scope.SSOList.model = $scope.SSOList.data.find(function (item) {
                            return item.id == $scope.organization.auth;
                        });
                    });
                    $userService.search({orgid: organization._id}).then(function(response) {
                        $scope.userlist = response.data.users.map(function (user) {
                            return {
                                id: user._id,
                                name: `${user.name} (${user.email})`,
                                selected: user.sso,
                            };
                        });
                    });
                };
                //users list prepare
                $scope.userlistOptions = {
                    availableLabel: 'Email-Password',
                    selectedLabel: 'SSO',
                    searchLabel: 'Email',
                };

                //call loading
                $scope.reload();

                $scope.save = function () {
                    switch ($scope.tabIndex) {
                        case 0:
                            $scope.organization = {
                                ...$scope.organization,
                                auth: ($scope.SSOList.model || {id: undefined}).id,
                            }
                            $organizationsService.updateSSOSettings($scope.organization).then(function (response) {
                                toastr.success(`SSO ${$scope.organization.name} Settings Updated Successfully`);
                                ngProgress.complete();
                            });
                            break;
                        case 1:
                            var users = $scope.userlist.map(function (item, index) {
                                return {
                                    _id: item.id,
                                    sso: item.selected,
                                };
                            });
                            $userService.updateSSOSettings(users).then(function (response) {
                                toastr.success(`SSO ${$scope.organization.name} Users' Settings Updated Successfully`);
                                ngProgress.complete();
                            });
                            break;
                    }
                }
            }
        ]
    )
});
