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
            'organizations',
            'ngProgress',
            '$rootScope',
            '$userService',
            '$organizationsService',
            'toastr',
            '$ssoService',
            function ($scope, $uibModalInstance, organization, organizations, ngProgress, $rootScope, $userService, $organizationsService, toastr, $ssoService) {
                ga('set', 'title', '/ssoSettings');
                ga('set', 'page', '/ssoSettings');
                ga('send', 'pageview');

                // sso
                $scope.ssoOrganizationModel = {
                    provider: [
                        {
                            name: 'None',
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
                    default: false,
                    providerModel: null,
                };
                $scope.ssoOrganizationModel.providerModel = $scope.ssoOrganizationModel.provider[0];

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };

                $scope.apply = function(setting) {};

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
                $scope.reload = function () {};

                //users list prepare
                $scope.userlistOptions = {
                    availableLabel: 'Email-Password',
                    selectedLabel: 'SSO',
                    searchLabel: 'Email',
                    hideSearch: true,
                };

                //call loading
                $scope.reload();

                $scope.save = function () {};
            }
        ]
    )
});
