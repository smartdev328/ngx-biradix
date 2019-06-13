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

                // $ssoService.updateOrgsIds(organizations).then(function () {
                    // sso
                    $scope.SSOSettings = {
                        provider: [
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
                        default: false,
                        changeDefault: function () {
                            $scope.SSOSettings.default = !$scope.SSOSettings.default;
                        },
                    };
                    $scope.SSOSettings.providerModel = $scope.SSOSettings.provider[0];

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
                        // $ssoService.getOrganizationSSOSettings(organization._id).then(function (response) {
                        //     $scope.organization = response.data.organization;
                        //     $scope.SSOList.model = $scope.SSOList.data.find(function (item) {
                        //         return item.id == $scope.organization.sso.system;
                        //     });
                        //     $scope.SSOForNewUsers = $scope.organization.sso.default;
                        // });
                        // $ssoService.getUsers(organization._id).then(function(response) {
                        //     $scope.userlist = response.data.users.map(function (user) {
                        //         return {
                        //             id: user._id,
                        //             name: user.name + ' (' + user.email + ')',
                        //             selected: user.sso,
                        //         };
                        //     });
                        // });
                    };
                    //users list prepare
                    $scope.userlistOptions = {
                        availableLabel: 'Email-Password',
                        selectedLabel: 'SSO',
                        searchLabel: 'Email',
                        hideSearch: true,
                    };

                    //call loading
                    $scope.reload();

                    $scope.save = function () {
                        // $ssoService.updateOrganizationSSOSettings(organization._id, {
                        //     system: ($scope.SSOList.model || {id: undefined}).id,
                        //     default: $scope.SSOForNewUsers,
                        // }).then(function (response) {
                        //     var users = $scope.userlist.map(function (item, index) {
                        //         return {
                        //             _id: item.id,
                        //             sso: item.selected,
                        //         };
                        //     });
                        //     $ssoService.updateUsers(organization._id, users).then(function (response) {
                        //         toastr.success('SSO ' + $scope.organization.name + 'Users\' Settings Updated Successfully');
                        //         ngProgress.complete();
                        //     });
                        // });
                    }
                // });
            }
        ]
    )
});
