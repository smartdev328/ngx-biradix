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
            function ($scope, $uibModalInstance, organization, ngProgress, $rootScope, $userService) {
                ga('set', 'title', '/ssoSettings');
                ga('set', 'page', '/ssoSettings');
                ga('send', 'pageview');

                $scope.organization = organization;

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

                // sso
                $scope.SSOList = {
                    data: [
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
                    ],
                    model: undefined,
                    change: function () {
                    },
                };

                // users
                $scope.reload = function () {
                    $userService.search({orgid: $scope.organization._id}).then(function(response) {
                        $scope.userlist = response.data.users.map(function (user) {
                            return {
                                id: user._id,
                                name: `${user.name} (${user.email})`,
                                selected: false,
                            };
                        });
                    });
                };
                $scope.userlistOptions = {
                    availableLabel: 'Email-Password',
                    selectedLabel: 'SSO',
                    searchLabel: 'Email',
                };
                $scope.reload();

            }
        ]
    )
});
