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

                $scope.organization = organization;

                // sso
                $scope.ssoOrganizationModel = {
                    provider: ['None', 'Azure','Okta'],
                    newUsers: organization.sso.newUsers,
                    providerModel: organization.sso.provider,
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };

                $scope.apply = function(setting) {};

                // tabs
                $scope.tabs = [
                    {
                        label: 'Config',
                        template: 'ssoParameters.html',
                    },
                    {
                        label: 'User Assignment',
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

                $scope.ssoUserModel = {
                    list: [],
                    options: {
                        availableLabel: 'BI:Radix Email/Password',
                        selectedLabel: 'Single Sign On',
                        searchLabel: 'Email',
                        hideSearch: true,
                    }
                }
                // load data
                $scope.reload = function () {
                    //users
                    $userService.search({orgid: organization._id}).then(function (response) {
                        $scope.ssoUserModel.list = response.data.users.map(function (user) {
                            var roles = user.roles.reduce(function (pV, cV) {
                                return pV + cV.name + ', ';
                            }, '');
                            roles = roles.length > 0 ? roles.substring(0, roles.length - 2) : roles;
                            return {
                                id: user._id,
                                name: user.name,
                                tooltip: 'Email: <b>' + user.email + '</b><br>Role: <b>' + roles + '</b>',
                                selected: user.settings && user.settings.allowSSO,
                            };
                        })
                    });

                };

                //call loading
                $scope.reload();

                $scope.save = function () {
                    var sso = {
                        newUsers: $scope.ssoOrganizationModel.newUsers,
                        provider: $scope.ssoOrganizationModel.providerModel
                    }
                    ngProgress.start();
                    $organizationsService.updateSSO(organization._id, sso).then(function (response) {
                        toastr.success('SSO Settings Updated Successfully');
                        ngProgress.complete();
                    }, function (response) {
                        toastr.error('Unable to update sso settings. Please contact an administrator.');
                        ngProgress.complete();
                    });
                };
            }
        ]
    )
});
