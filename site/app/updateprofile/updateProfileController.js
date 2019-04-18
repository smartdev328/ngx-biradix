'use strict';
define([
    'app',
    '../../services/cronService.js',
], function (app) {
     app.controller
        ('updateProfileController', ['$scope', '$authService', 'ngProgress', '$rootScope','toastr', '$location','$userService','$stateParams','$propertyService','$cronService', function ($scope, $authService, ngProgress, $rootScope, toastr, $location,$userService,$stateParams,$propertyService,$cronService) {
            window.setTimeout(function() {window.document.title = "My Account - Update Profile | BI:Radix";},1500);

            $rootScope.nav = "";
            $rootScope.sideMenu = true;

            if ($stateParams.password) {
                $scope.isPassword = true;
                $rootScope.sideNav = "UpdatePassword";
            } else if ($stateParams.notifications === "1") {
                $scope.isNotifications = true;
                $rootScope.sideNav = "UpdateNotifications";
            } else if ($stateParams.settings === "1") {
                $scope.isSettings = true;
                $rootScope.sideNav = "UpdateSettings";
            } else {
                $scope.isProfile = true;
                $rootScope.sideNav = "UpdateProfile";
            }

                $scope.timezones = [
                {id: 'America/Los_Angeles', name: "Los Angeles (Pacific)"},
                {id: 'America/Phoenix', name: "Phoenix (Arizona)"},
                {id: 'America/Denver', name: "Denver (Mountain)"},
                {id: 'America/Chicago', name: "Chicago (Central)"},
                {id: 'America/New_York', name: "New York (Eastern)"},
            ];


            $scope.settings = {
                tz: $scope.timezones[0]
            }


            var unbind = $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    $scope.settings.tz = _.find($scope.timezones, function(x) {return x.id == $rootScope.me.settings.tz});

                    if (!$scope.settings.tz) {
                        $scope.settings.tz = $scope.timezones[0];
                    }

                    $scope.settings.showLeases = $rootScope.me.settings.showLeases;
                    $scope.settings.showATR = $rootScope.me.settings.showATR;
                    $scope.settings.showRenewal = $rootScope.me.settings.showRenewal;
                    $scope.settings.notifications = {on: $rootScope.me.settings.notifications.on, groupComps: $rootScope.me.settings.notifications.groupComps, toggle: false}
                    $scope.settings.reminders = {on: $rootScope.me.settings.reminders.on}

                    $scope.user = { first: $rootScope.me.first, last:  $rootScope.me.last, email:  $rootScope.me.email }

                    $scope.canUpdateEmail = $rootScope.me.permissions.indexOf('Users/UpdateEmail') > -1

                    if (!$rootScope.me.passwordUpdated) {
                        toastr.warning('For security purposes, please update the temporary password assigned to you.');
                    }

                    if ($rootScope.me.bounceReason) {
                        toastr.error('We were unable to deliver email to your email address: <b>' + $rootScope.me.email + '</b>. Please verify your email address and click "Update".');
                    }

                    //$rootScope.me.settings.notifications.props = ['5642bae9ff18a018187b2e9f','5642bab4ff18a018187b0417'];

                    $scope.nots = $cronService.getOptions($rootScope.me.settings.notifications.cron);

                    $scope.nots.all = false;

                    $scope.propertyOptions = {noneLabel: "All", panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Excluded Properties", labelSelected: "Included Properties", searchLabel: "Properties" }

                    $scope.columnsOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }

                    $scope.setNotificationColumns($rootScope.me.settings.notification_columns);

                    $scope.propertyItems = {items: []};

                    if ($rootScope.me.settings.notifications.props.length == 0) {
                        $scope.notificationsLoaded = true;
                    }
                    else {
                        $propertyService.search({
                            permission: ['PropertyManage'],
                            active: true,
                            ids: $rootScope.me.settings.notifications.props
                            , skipAmenities: true
                        }).then(function (response) {

                            if (response.data.properties || response.data.properties.length > 0) {
                                response.data.properties.forEach(function(p) {
                                    $scope.propertyItems.items.push({id: p._id, name: p.name})
                                })

                            }


                            $scope.notificationsLoaded = true;

                        }, function (error) {
                            $scope.notificationsLoaded = true;
                        })
                    }

                    unbind();
                }
            })

            $scope.setNotificationColumns = function(columns) {
                $scope.columnsItems = {items: []};
                $scope.columnsItems.items = [
                    {id: "occupancy", name: "Occ. %", selected: columns.occupancy},
                    {id: "leased", name: "Leased %", selected: columns.leased || false},
                    {id: "atr", name: "ATR %", selected: columns.atr || false},
                    {id: "weekly", name: "Traffic & Leases / Week", selected: columns.weekly},
                    {id: "units", name: "Units", selected: columns.units},
                    {id: "sqft", name: "Sqft", selected: columns.sqft},
                    {id: "rent", name: "Rent", selected: columns.rent},
                    {id: "concessions", name: "Total Concession", selected: columns.concessions},
                    {id: "runrate", name: "Recurring Rent", selected: columns.runrate},
                    {id: "runratesqft", name: "Recurring Rent / Sqft", selected: columns.runratesqft},
                    {id: "ner", name: "Net Eff. Rent", selected: columns.ner},
                    {id: "nerweek", name: "NER vs Last Week", selected: columns.nerweek},
                    {id: "nermonth", name: "NER vs Last Month", selected: columns.nermonth},
                    {id: "neryear", name: "NER vs Last Year", selected: columns.neryear},
                    {id: "nersqft", name: "Net Eff. Rent / Sqft", selected: columns.nersqft},
                    {id: "nersqftweek", name: "NER/Sqft vs Last Week", selected: columns.nersqftweek},
                    {id: "nersqftmonth", name: "NER/Sqft vs Last Month", selected: columns.nersqftmonth},
                    {id: "nersqftyear", name: "NER/Sqft vs Last Year", selected: columns.nersqftyear},
                    {id: "nervscompavg", name: "NER vs Comp Avg", selected: columns.nervscompavg},
                    {id: "last_updated", name: "Last Updated", selected: columns.last_updated},
                ];

                if (!$rootScope.me.settings.showLeases) {
                    _.remove($scope.columnsItems.items, function(x) {return x.id == 'leased'})
                }

                if (!$rootScope.me.settings.showATR) {
                    _.remove($scope.columnsItems.items, function(x) {return x.id == 'atr'})
                }
            }

            $scope.autocompleteproperties = function(search,callback) {
                $propertyService.search({
                    limit: 100,
                    permission: ['PropertyManage'],
                    active: true,
                    search:search
                    , skipAmenities: true
                    , hideCustom : true
                }).then(function (response) {
                    callback(response.data.properties)
                }, function (error) {
                    callback([]);
                })

            }

            $scope.submit = function (user) {
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();
                $authService.updateMe(user).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                        toastr.error(errors);
                    }
                    else {
                        toastr.success('Profile updated successfully.');
                        $rootScope.refreshToken(true, function() {});
                    }


                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                    toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                    ngProgress.complete();
                });
            }

            $scope.password = {};

            $scope.submitPassword = function(user, myFormPassword) {

                if (user.newpassword != user.confirmpassword) {
                    toastr.error('Passwords do not match.');
                    return;
                }
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $userService.updatePassword(user).then(function (resp) {
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        resp.data.errors.forEach(function(e) {
                            toastr.error(e.msg);
                        })
                        $('button.contact-submit').prop('disabled', false);
                        ngProgress.complete();
                    }
                    else {
                        $rootScope.refreshToken(true, function() {
                            toastr.success('Password updated successfully.');
                            user.newpassword = "";
                            user.confirmpassword = "";
                            user.currentpassword = "";
                            $rootScope.me.passwordUpdated = true;
                            myFormPassword.$setPristine();
                            myFormPassword.$setUntouched();
                            $('button.contact-submit').prop('disabled', false);
                            ngProgress.complete();
                        });
                    }

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                    toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                    ngProgress.complete();
                });
            }

            $scope.saveNotifications = function() {
                if ($rootScope.me.settings.notifications.on === true) {

                    if ($scope.nots.all === true) {
                        $rootScope.me.settings.notifications.props = [];
                    } else {
                        $rootScope.me.settings.notifications.props = _.pluck($scope.propertyItems.items,"id")
                    }

                    $rootScope.me.settings.notifications.cron = $cronService.getCron($scope.nots);

                    $rootScope.me.settings.notifications.on = $scope.settings.notifications.on;
                    $rootScope.me.settings.reminders.on = $scope.settings.reminders.on;
                    $rootScope.me.settings.notifications.groupComps = $scope.settings.notifications.groupComps;

                    var c= 0;
                    $scope.columnsItems.items.forEach(function (f) {
                        $rootScope.me.settings.notification_columns[f.id] = f.selected;

                        if (f.selected === true) {
                            c++;
                        }
                    })

                    if (c > 13) {
                        toastr.error("<B>Unable to Update Notification Settings!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in the property status update.")

                        return;
                    }
                }

                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $authService.updateSettings($rootScope.me.settings).then(function (resp) {
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        resp.data.errors.forEach(function(e) {
                            toastr.error(e.msg);
                        });
                        $('button.contact-submit').prop('disabled', false);
                        ngProgress.complete();
                    }
                    else {
                        toastr.success("Notifications updated successfully.");

                        $rootScope.refreshToken(true, function() {
                            $('button.contact-submit').prop('disabled', false);
                            ngProgress.complete();
                        });
                    }
                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                    toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                    ngProgress.complete();
                });
            }

            $scope.saveSettings = function() {

                $rootScope.me.settings.tz = $scope.settings.tz.id;
                $rootScope.me.settings.showLeases = $scope.settings.showLeases;
                $rootScope.me.settings.showATR = $scope.settings.showATR;
                $rootScope.me.settings.showRenewal = $scope.settings.showRenewal;


                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $authService.updateSettings($rootScope.me.settings).then(function (resp) {
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        resp.data.errors.forEach(function(e) {
                            toastr.error(e.msg);
                        })
                        $('button.contact-submit').prop('disabled', false);
                        ngProgress.complete();
                    } else {
                        toastr.success("Settings updated successfully.");

                        $rootScope.refreshToken(true, function() {
                            $('button.contact-submit').prop('disabled', false);
                            ngProgress.complete();
                        });
                    }
                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                    toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                    ngProgress.complete();
                });
            }

            $scope.reset = function() {
                $scope.propertyItems.items = [];
                $scope.settings.notifications.groupComps = undefined;
                $scope.setNotificationColumns($rootScope.me.orgs[0].settings.notification_columns.default_value);
                $scope.nots = $cronService.getOptions($rootScope.me.orgs[0].settings.how_often.default_value);
                $scope.settings.notifications.on = $rootScope.me.orgs[0].settings.updates.default_value;
                $scope.settings.reminders.on = $rootScope.me.orgs[0].settings.reminders.default_value;
                toastr.success("Notifications reset to company default. Please make sure to save your changes.");

            }

            $scope.sendReport = function() {

                var c= 0;
                var notification_columns = {};
                $scope.columnsItems.items.forEach(function (f) {
                    notification_columns[f.id] = f.selected;

                    if (f.selected === true) {
                        c++;
                    }
                })

                if (c > 13) {
                    toastr.error("<B>Unable to Update Notification Settings!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in the property status update.")

                    return;
                }

                var properties= [];
                if (!$scope.nots.all) {
                    properties = _.pluck($scope.propertyItems.items,"id");
                }
                $propertyService.notifications_test(properties,$scope.settings.showLeases,notification_columns, $scope.settings.notifications.groupComps);
                toastr.success('Your request for a notifications report has been submitted. Please allow up to 5 minutes to receive your report.');
            }
        }]);

});