'use strict';
define([
    'app',
    '../../services/cronService.js',
    '../../services/organizationsService.js',
], function (app) {
     app.controller
        ('defaultSettingsController', ['$scope', '$uibModalInstance', 'organization', 'ngProgress', '$rootScope','toastr','$cronService','$organizationsService','$userService','$dialog', function ($scope, $uibModalInstance, organization, ngProgress, $rootScope, toastr,$cronService,$organizationsService,$userService,$dialog) {

            ga('set', 'title', "/defaultSettings");
            ga('set', 'page', "/defaultSettings");
            ga('send', 'pageview');
            
            $scope.organization = organization;

            $scope.nots = $cronService.getOptions($scope.organization.settings.how_often.default_value);

            $scope.columnsOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
            $scope.columnsItems = [
                {id: "occupancy", name: "Occ. %", selected: $scope.organization.settings.notification_columns.default_value.occupancy},
                {id: "leased", name: "Leased %", selected: $scope.organization.settings.notification_columns.default_value.leased},
                {id: "atr", name: "ATR %", selected: $scope.organization.settings.notification_columns.default_value.atr},
                {id: "weekly", name: "Traffic & Leases / Week", selected: $scope.organization.settings.notification_columns.default_value.weekly},
                {id: "units", name: "Units", selected: $scope.organization.settings.notification_columns.default_value.units},
                {id: "sqft", name: "Sqft", selected: $scope.organization.settings.notification_columns.default_value.sqft},
                {id: "rent", name: "Rent", selected: $scope.organization.settings.notification_columns.default_value.rent},
                {id: "concessions", name: "Total Concession", selected: $scope.organization.settings.notification_columns.default_value.concessions},
                {id: "runrate", name: "Recurring Rent", selected: $scope.organization.settings.notification_columns.default_value.runrate},
                {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $scope.organization.settings.notification_columns.default_value.runratesqft},
                {id: "ner", name: "Net Eff. Rent", selected: $scope.organization.settings.notification_columns.default_value.ner},
                {id: "nerweek", name: "NER vs Last Week", selected: $scope.organization.settings.notification_columns.default_value.nerweek},
                {id: "nermonth", name: "NER vs Last Month", selected: $scope.organization.settings.notification_columns.default_value.nermonth},
                {id: "neryear", name: "NER vs Last Year", selected: $scope.organization.settings.notification_columns.default_value.neryear},
                {id: "nersqft", name: "Net Eff. Rent / Sqft", selected: $scope.organization.settings.notification_columns.default_value.nersqft},
                {id: "nersqftweek", name: "NER/Sqft vs Last Week", selected: $scope.organization.settings.notification_columns.default_value.nersqftweek},
                {id: "nersqftmonth", name: "NER/Sqft vs Last Month", selected: $scope.organization.settings.notification_columns.default_value.nersqftmonth},
                {id: "nersqftyear", name: "NER/Sqft vs Last Year", selected: $scope.organization.settings.notification_columns.default_value.nersqftyear},
                {id: "nervscompavg", name: "NER vs Comp Avg", selected: $scope.organization.settings.notification_columns.default_value.nervscompavg},
                {id: "last_updated", name: "Last Updated", selected: $scope.organization.settings.notification_columns.default_value.last_updated},
            ];            

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.save = function() {
                $scope.organization.settings.how_often.default_value = $cronService.getCron($scope.nots);
                var c= 0;
                $scope.columnsItems.forEach(function (f) {
                    $scope.organization.settings.notification_columns.default_value[f.id] = f.selected;

                    if (f.selected === true) {
                        c++;
                    }
                })

                if (c > 13) {
                    toastr.error("<B>Unable to Update Notification Settings!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in the property status update.")

                    return;
                }

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

                $scope.organization.settings.notification_columns.default_value = {};

                var c= 0;
                $scope.columnsItems.forEach(function (f) {
                    $scope.organization.settings.notification_columns.default_value[f.id] = f.selected;

                    if (f.selected === true) {
                        c++;
                    }
                })

                if (c > 13) {
                    toastr.error("<B>Unable to Update Notification Settings!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in the property status update.")

                    return;
                }


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
                        $dialog.confirm('Are you sure you want to apply <B>' + setting +': ' + JSON.stringify(value).replace(/,/ig,', ') +'</B> to: <B>' + resp.data.users.join(', ') +'</B>"?', function() {

                            $userService.updateUsersForSettingsApply({
                                orgid: organization._id,
                                setting: setting,
                                value: value
                            }).then(function (resp) {
                                $('button.apply').prop('disabled', false);
                                ngProgress.complete();

                                if (resp.data.bad.length == 0) {
                                    toastr.success('<B>' + resp.data.good.join(', ') + '</B> where updated with <B>' + setting + ': ' + JSON.stringify(value).replace(/,/ig,', ') + '</B>');
                                } else
                                    if (resp.data.good.length == 0) {
                                    toastr.error('<B>' + resp.data.bad.join(', ') + '</B> where NOT updated with <B>' + setting + ': ' + JSON.stringify(value).replace(/,/ig,', ') + '</B>');
                                }
                                else {
                                        toastr.error('<B>' + resp.data.bad.join(', ') + '</B> where NOT updated, <B>' + resp.data.good.join(', ') + '</B> where updated with <B>' + setting + ': ' + JSON.stringify(value).replace(/,/ig,', ') + '</B>');
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

            $scope.$watch("columnsItems", function(n, o) {
                var o = _.map(o, function(x) {return x.selected.toString()}).join(',')
                var n = _.map(n, function(x) {return x.selected.toString()}).join(',')

                if (n != o) {
                    $scope.organization.settings.notification_columns.configured=true
                }

            }, true);

    }]);

});