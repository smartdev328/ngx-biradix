'use strict';
define([
    'app',
    '../../services/cronService.js',
    '../../services/organizationsService.js',
    '../../services/userService.js',
    '../../components/dialog/module.js'
], function (app) {
     app.controller
        ('defaultSettingsController', ['$scope', '$uibModalInstance', 'organization', 'ngProgress', '$rootScope','toastr','$cronService','$organizationsService','$userService','$dialog', function ($scope, $uibModalInstance, organization, ngProgress, $rootScope, toastr,$cronService,$organizationsService,$userService,$dialog) {

            ga('set', 'title', "/defaultSettings");
            ga('set', 'page', "/defaultSettings");
            ga('send', 'pageview');
            
            $scope.organization = organization;

            $scope.nots = $cronService.getOptions($scope.organization.settings.how_often.default_value);

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.save = function() {
                $scope.organization.settings.how_often.default_value = $cronService.getCron($scope.nots);

                ngProgress.start();
                $organizationsService.updateDefaultSettings($scope.organization).then(function (response) {
                    if (response.data.errors) {
                        toastr.error(_.pluck(response.data.errors, 'msg').join("<br>"));
                    }
                    else {
                        toastr.success('Default Settings Updated Successfully');
                    }
                    ngProgress.complete();
                }, function (response) {
                    toastr.error('Unable to update settings. Please contact an administrator');
                    ngProgress.complete();
                })
            }

            $scope.apply = function(setting) {
                $scope.organization.settings.how_often.default_value = $cronService.getCron($scope.nots);
                $('button.apply').prop('disabled', true);
                ngProgress.start();
                var value = $scope.organization.settings[setting].default_value;
                $userService.getUsersForSettingsApply({
                    orgid: organization._id,
                    setting: setting,
                    value: value
                }).then(function (resp) {
                    $('button.apply').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.users.length == 0) {
                        toastr.warning('There are no users that require updates to this setting.');
                        return
                    } else {
                        $dialog.confirm('Are you sure you want to apply <B>' + setting +': ' + value +'</B> to: <B>' + resp.data.users.join(', ') +'</B>"?', function() {

                            $userService.updateUsersForSettingsApply({
                                orgid: organization._id,
                                setting: setting,
                                value: value
                            }).then(function (resp) {
                                $('button.apply').prop('disabled', false);
                                ngProgress.complete();

                                if (resp.data.bad.length == 0) {
                                    toastr.success('<B>' + resp.data.good.join(', ') + '</B> where updated with <B>' + setting + ': ' + value + '</B>');
                                } else
                                    if (resp.data.good.length == 0) {
                                    toastr.error('<B>' + resp.data.bad.join(', ') + '</B> where NOT updated with <B>' + setting + ': ' + value + '</B>');
                                }
                                else {
                                        toastr.error('<B>' + resp.data.bad.join(', ') + '</B> where NOT updated, <B>' + resp.data.good.join(', ') + '</B> where updated with <B>' + setting + ': ' + value + '</B>');
                                    }

                            }, function (err) {
                                $('button.apply').prop('disabled', false);
                                toastr.error('Unable to perform action. Please contact an administrator');
                                ngProgress.complete();
                            });
                        }, function() {

                        });
                    }


                }, function (err) {
                    $('button.apply').prop('disabled', false);
                    toastr.error('Unable to perform action. Please contact an administrator');
                    ngProgress.complete();
                });
            }

    }]);

});